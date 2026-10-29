// Finnly Connect (finnlyconnect.com). The public facility schedule page embeds every
// upcoming event as a JSON array literal (a Kendo scheduler data source), with zone-less
// Detroit-local times.
import { detroitToUtc } from '../../src/lib/time.ts';
import { ageGroupFrom, classify } from '../classify.ts';
import { getText } from '../http.ts';
import type { DateWindow, FinnlySource, ScrapedSession } from '../types.ts';

interface FinnlyEvent {
	EventId: number;
	EventStartTime: string; // "2026-10-26T12:30:00", local
	EventEndTime: string;
	AccountName: string; // session name for public sessions, renter name otherwise
	EventTypeName: string;
	FacilityName: string; // sheet of ice
	Closed: boolean;
}

// Only public sessions are open to walk-ups; rentals and team ice are excluded.
const PUBLIC_EVENT_TYPE = 'Public Session';

export async function finnly(source: FinnlySource, window: DateWindow): Promise<ScrapedSession[]> {
	const html = await getText(source.scheduleUrl);
	const sessions: ScrapedSession[] = [];

	for (const event of extractEvents(html)) {
		if (event.Closed || event.EventTypeName !== PUBLIC_EVENT_TYPE) continue;
		const type = classify(event.AccountName);
		if (!type) continue;
		const day = event.EventStartTime.slice(0, 10);
		if (day < window.from || day > window.to) continue;

		sessions.push({
			sourceId: `finnly:${event.EventId}`,
			type,
			title: `${event.AccountName.trim()} (${event.FacilityName})`,
			startsAt: detroitToUtc(event.EventStartTime).toISOString(),
			endsAt: detroitToUtc(event.EventEndTime).toISOString(),
			ageGroup: ageGroupFrom(event.AccountName),
			priceCents: null,
			bookingUrl: null,
			sourceUrl: source.scheduleUrl
		});
	}

	return sessions;
}

function extractEvents(html: string): FinnlyEvent[] {
	const start = html.indexOf('[{"EventId"');
	if (start < 0) throw new Error('Finnly: event array not found in schedule page (layout changed?)');
	return JSON.parse(html.slice(start, matchingBracket(html, start) + 1));
}

/** Index of the `]` closing the array that opens at `start`, skipping over JSON strings. */
function matchingBracket(text: string, start: number) {
	let depth = 0;
	let inString = false;
	for (let i = start; i < text.length; i++) {
		const c = text[i];
		if (inString) {
			if (c === '\\') i++;
			else if (c === '"') inString = false;
		} else if (c === '"') inString = true;
		else if (c === '[' || c === '{') depth++;
		else if (c === ']' || c === '}') {
			if (--depth === 0) return i;
		}
	}
	throw new Error('Finnly: unterminated event array');
}
