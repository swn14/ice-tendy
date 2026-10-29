// Bond Sports (bondsports.co) — used by Black Bear / Biggby Coffee Ice Cube rinks.
// Public, unauthenticated endpoints discovered from the bondsports.co web app:
//   GET /v1/programs/:programId/seasons
//   GET /v4/programs-seasons/:seasonId/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&page=N&itemsPerPage=N
import type { AgeGroup } from '../../src/lib/types.ts';
import { addDays } from '../../src/lib/time.ts';
import { getJson } from '../http.ts';
import type { BondSource, DateWindow, ScrapedSession } from '../types.ts';

const API = 'https://api.bondsports.co';

interface BondSeason {
	id: number;
	name: string;
	startDate: string; // YYYY-MM-DD
	endDate: string;
	description: string | null;
	minAge: string | null; // e.g. "25 y"
	maxAge: string | null;
	linkSEO: string | null;
	deletedAt: string | null;
}

interface BondEvent {
	id: number;
	title: string;
	startDate: string; // ISO UTC
	endDate: string;
	private: boolean;
	deletedAt: string | null;
}

interface BondEventsPage {
	events: BondEvent[];
	meta: { currentPage: number; totalPages: number };
}

export async function bond(source: BondSource, window: DateWindow): Promise<ScrapedSession[]> {
	const sessions: ScrapedSession[] = [];

	for (const { programId, type } of source.programs) {
		const { data: seasons } = await getJson<{ data: BondSeason[] }>(`${API}/v1/programs/${programId}/seasons`);

		for (const season of seasons) {
			if (season.deletedAt || season.endDate < window.from || season.startDate > window.to) continue;
			// Goalie-only seasons mirror the skater slots and would show up as duplicates.
			if (/goalie/i.test(season.name)) continue;

			const ageGroup = ageGroupFor(season);
			const priceCents = priceFrom(season.description);
			const title = season.name.replace(/\s*-\s*click here.*$/i, '').trim();

			for (const event of await seasonEvents(season.id, window)) {
				if (event.private || event.deletedAt) continue;
				sessions.push({
					sourceId: `bond:${event.id}`,
					type,
					title,
					startsAt: event.startDate,
					endsAt: event.endDate,
					ageGroup,
					priceCents,
					bookingUrl: season.linkSEO,
					sourceUrl: `${API}/v4/programs-seasons/${season.id}/events`
				});
			}
		}
	}

	return sessions;
}

async function seasonEvents(seasonId: number, window: DateWindow) {
	// The API filters by UTC date, so pad a day each side; the runner trims to Detroit-local dates.
	const params = new URLSearchParams({
		startDate: addDays(window.from, -1),
		endDate: addDays(window.to, 1),
		itemsPerPage: '100'
	});
	const events: BondEvent[] = [];
	for (let page = 1; ; page++) {
		params.set('page', String(page));
		const res = await getJson<BondEventsPage>(`${API}/v4/programs-seasons/${seasonId}/events?${params}`);
		events.push(...res.events);
		if (res.meta.currentPage >= res.meta.totalPages) return events;
	}
}

function ageGroupFor(season: BondSeason): AgeGroup {
	if (/youth|kids|junior/i.test(season.name)) return 'youth';
	if (/adult|\d+\s*\+/i.test(season.name)) return 'adult';
	const min = parseInt(season.minAge ?? '', 10);
	const max = parseInt(season.maxAge ?? '', 10);
	if (min >= 18) return 'adult';
	if (max <= 18) return 'youth';
	return 'all';
}

/** Bond doesn't expose per-event prices publicly; seasons usually state one in the description. */
function priceFrom(description: string | null) {
	const match = description?.replace(/<[^>]+>|&nbsp;/g, ' ').match(/\$\s?(\d+(?:\.\d{2})?)/);
	return match ? Math.round(Number(match[1]) * 100) : null;
}
