// Hand-entered weekly schedules for rinks that only publish times as prose. Expands each
// ManualSession into dated occurrences inside the window. The app flags these as unconfirmed.
import { addDays, detroitToUtc } from '../../src/lib/time.ts';
import type { DateWindow, ManualSource, ScrapedSession, Weekday } from '../types.ts';

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export async function manual(source: ManualSource, window: DateWindow): Promise<ScrapedSession[]> {
	const sessions: ScrapedSession[] = [];

	for (let day = window.from; day <= window.to; day = addDays(day, 1)) {
		const weekday = WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()];
		for (const s of source.sessions) {
			if (!s.days.includes(weekday) || (s.from && day < s.from) || (s.until && day > s.until)) continue;
			sessions.push({
				sourceId: `manual:${s.type}:${day}T${s.start}`,
				type: s.type,
				title: s.title ?? null,
				startsAt: detroitToUtc(`${day}T${s.start}`).toISOString(),
				endsAt: detroitToUtc(`${day}T${s.end}`).toISOString(),
				ageGroup: s.ageGroup ?? null,
				priceCents: s.priceCents ?? null,
				bookingUrl: null,
				sourceUrl: source.evidenceUrl
			});
		}
	}
	return sessions;
}
