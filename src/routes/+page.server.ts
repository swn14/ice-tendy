import { env } from 'cloudflare:workers';
import { activeRinks, sessionsOn } from '#lib/server/db.ts';
import { milesBetween, ORIGIN } from '#lib/geo.ts';
import { localDate } from '#lib/time.ts';
import type { SessionType } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

const TYPES = new Set<SessionType>(['drop_in', 'sticks_pucks']);

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const dateParam = url.searchParams.get('date');
	const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : localDate();

	const typeParam = url.searchParams.get('type');
	const type = TYPES.has(typeParam as SessionType) ? (typeParam as SessionType) : null;

	const [sessions, rinks] = await Promise.all([sessionsOn(env.DB, date, type), activeRinks(env.DB)]);

	// Group by rink, nearest to Ann Arbor first.
	const byRink = new Map<string, { rink: (typeof sessions)[number]['rink']; miles: number; sessions: typeof sessions }>();
	for (const s of sessions) {
		let group = byRink.get(s.rink_id);
		if (!group) {
			group = { rink: s.rink, miles: milesBetween(ORIGIN, s.rink), sessions: [] };
			byRink.set(s.rink_id, group);
		}
		group.sessions.push(s);
	}

	setHeaders({ 'cache-control': 'public, max-age=300' });

	return {
		date,
		type,
		total: sessions.length,
		rinkCount: rinks.length,
		rinks: [...byRink.values()].sort((a, b) => a.miles - b.miles)
	};
};
