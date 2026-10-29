import { error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { rinkById, sessionsForRink } from '#lib/server/db.ts';
import { milesBetween, ORIGIN } from '#lib/geo.ts';
import { addDays, localDate } from '#lib/time.ts';
import type { Session } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

const UPCOMING_DAYS = 14;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const rink = await rinkById(env.DB, params.id);
	if (!rink) error(404, 'Rink not found');

	const from = localDate();
	const sessions = await sessionsForRink(env.DB, rink.id, from, addDays(from, UPCOMING_DAYS - 1));

	const days: { date: string; sessions: Session[] }[] = [];
	for (const s of sessions) {
		if (days.at(-1)?.date !== s.local_date) days.push({ date: s.local_date, sessions: [] });
		days.at(-1)!.sessions.push(s);
	}

	setHeaders({ 'cache-control': 'public, max-age=300' });

	return { rink, miles: milesBetween(ORIGIN, rink), days, sessions, upcomingDays: UPCOMING_DAYS };
};
