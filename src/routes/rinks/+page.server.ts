import { env } from 'cloudflare:workers';
import { activeRinks, sessionCounts } from '#lib/server/db.ts';
import { milesBetween, ORIGIN } from '#lib/geo.ts';
import { addDays, localDate } from '#lib/time.ts';
import type { PageServerLoad } from './$types';

const UPCOMING_DAYS = 14;

export const load: PageServerLoad = async ({ setHeaders }) => {
	const from = localDate();
	const [rinks, counts] = await Promise.all([
		activeRinks(env.DB),
		sessionCounts(env.DB, from, addDays(from, UPCOMING_DAYS - 1))
	]);

	setHeaders({ 'cache-control': 'public, max-age=300' });

	return {
		days: UPCOMING_DAYS,
		rinks: rinks
			.map((rink) => ({
				rink,
				miles: milesBetween(ORIGIN, rink),
				counts: counts.get(rink.id) ?? { sticks_pucks: 0, drop_in: 0 }
			}))
			.sort((a, b) => a.miles - b.miles)
	};
};
