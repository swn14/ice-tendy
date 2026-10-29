import { localDate } from '../src/lib/time.ts';
import type { DateWindow, RinkConfig, ScrapedSession } from './types.ts';

export type Outcome = { ok: true; sessions: ScrapedSession[] } | { ok: false; error: string };

/**
 * Replace a rink's sessions inside the window with a fresh scrape, atomically.
 * On failure, keep the old sessions and just record the error.
 */
export async function saveRink(db: D1Database, rink: RinkConfig, window: DateWindow, outcome: Outcome) {
	const now = new Date().toISOString();
	const statements = [
		db
			.prepare(
				`INSERT INTO rinks (id, name, city, address, lat, lng, website, schedule_url, adapter)
				 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
				 ON CONFLICT (id) DO UPDATE SET name = excluded.name, city = excluded.city,
				   address = excluded.address, lat = excluded.lat, lng = excluded.lng,
				   website = excluded.website, schedule_url = excluded.schedule_url, adapter = excluded.adapter`
			)
			.bind(rink.id, rink.name, rink.city, rink.address, rink.lat, rink.lng, rink.website, rink.scheduleUrl, rink.source.adapter)
	];

	if (outcome.ok) {
		statements.push(
			db
				.prepare('DELETE FROM sessions WHERE rink_id = ?1 AND local_date BETWEEN ?2 AND ?3')
				.bind(rink.id, window.from, window.to),
			...outcome.sessions.map((s) =>
				db
					.prepare(
						`INSERT OR REPLACE INTO sessions (id, rink_id, type, title, starts_at, ends_at, local_date,
						   age_group, price_cents, booking_url, source_url, fetched_at)
						 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
					)
					.bind(
						`${rink.id}:${s.sourceId}`,
						rink.id,
						s.type,
						s.title,
						s.startsAt,
						s.endsAt,
						localDate(new Date(s.startsAt)),
						s.ageGroup,
						s.priceCents,
						s.bookingUrl,
						s.sourceUrl,
						now
					)
			),
			db.prepare('UPDATE rinks SET last_checked_at = ?2, last_error = NULL WHERE id = ?1').bind(rink.id, now)
		);
	} else {
		statements.push(db.prepare('UPDATE rinks SET last_error = ?2 WHERE id = ?1').bind(rink.id, outcome.error));
	}

	await db.batch(statements);
}

/** Drop the fake rinks/sessions from `npm run db:seed:local` so they don't mix with real data. */
export async function clearSampleData(db: D1Database) {
	await db.batch([
		db.prepare("DELETE FROM sessions WHERE rink_id LIKE 'sample-%'"),
		db.prepare("DELETE FROM rinks WHERE id LIKE 'sample-%'")
	]);
}
