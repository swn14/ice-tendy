import type { Rink, Session, SessionType } from '#lib/types.ts';

export type SessionWithRink = Session & { rink: Rink };

const RINK_COLUMNS = 'id, name, city, address, lat, lng, website, schedule_url, adapter, last_checked_at';

export async function sessionsOn(db: D1Database, date: string, type: SessionType | null) {
	const { results } = await db
		.prepare(
			`SELECT s.*, r.name AS rink_name, r.city, r.address, r.lat, r.lng, r.website,
			        r.schedule_url, r.adapter, r.last_checked_at
			 FROM sessions s JOIN rinks r ON r.id = s.rink_id
			 WHERE s.local_date = ?1 AND (?2 IS NULL OR s.type = ?2) AND r.active = 1
			 ORDER BY s.starts_at`
		)
		.bind(date, type)
		.all<Record<string, unknown>>();

	return results.map((row): SessionWithRink => {
		const { rink_name, city, address, lat, lng, website, schedule_url, adapter, last_checked_at, ...s } = row;
		return {
			...(s as unknown as Session),
			rink: {
				id: s.rink_id as string,
				name: rink_name as string,
				city: city as string,
				address: address as string | null,
				lat: lat as number,
				lng: lng as number,
				website: website as string | null,
				schedule_url: schedule_url as string | null,
				adapter: adapter as string | null,
				last_checked_at: last_checked_at as string | null
			}
		};
	});
}

export async function activeRinks(db: D1Database) {
	const { results } = await db.prepare(`SELECT ${RINK_COLUMNS} FROM rinks WHERE active = 1`).all<Rink>();
	return results;
}

export async function rinkById(db: D1Database, id: string) {
	return db.prepare(`SELECT ${RINK_COLUMNS} FROM rinks WHERE id = ?1 AND active = 1`).bind(id).first<Rink>();
}

/** Sessions at one rink between two Detroit-local dates, inclusive. */
export async function sessionsForRink(db: D1Database, rinkId: string, from: string, to: string) {
	const { results } = await db
		.prepare('SELECT * FROM sessions WHERE rink_id = ?1 AND local_date BETWEEN ?2 AND ?3 ORDER BY starts_at')
		.bind(rinkId, from, to)
		.all<Session>();
	return results;
}

/** Per-rink session counts by type between two Detroit-local dates, inclusive. */
export async function sessionCounts(db: D1Database, from: string, to: string) {
	const { results } = await db
		.prepare(
			`SELECT rink_id, type, COUNT(*) AS n FROM sessions
			 WHERE local_date BETWEEN ?1 AND ?2 GROUP BY rink_id, type`
		)
		.bind(from, to)
		.all<{ rink_id: string; type: SessionType; n: number }>();

	const counts = new Map<string, Record<SessionType, number>>();
	for (const { rink_id, type, n } of results) {
		const entry = counts.get(rink_id) ?? { sticks_pucks: 0, drop_in: 0 };
		entry[type] = n;
		counts.set(rink_id, entry);
	}
	return counts;
}
