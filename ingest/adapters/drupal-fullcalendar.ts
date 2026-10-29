// Drupal "FullCalendar View" pages (e.g. eddieedgar.org/schedule). The page's
// <script data-drupal-selector="drupal-settings-json"> holds every event under
// fullCalendarView[].calendar_options.events, with zone-less times in calendar_options.timeZone.
// Titles look like "(Sticks and Pucks) @ Edgar B arena, Sticks and Pucks".
import { detroitToUtc } from '../../src/lib/time.ts';
import { ageGroupFrom, classify } from '../classify.ts';
import { getText } from '../http.ts';
import type { DateWindow, DrupalFullCalendarSource, ScrapedSession } from '../types.ts';

interface FullCalendarEvent {
	title: string;
	eid: string; // stable per occurrence, e.g. "4181-R-116-I-17"
	url: string;
	start: string; // "2026-12-22T11:45:00" or "2026-12-22" for all-day
	end?: string;
	allDay: boolean;
}

interface DrupalSettings {
	fullCalendarView?: { calendar_options: string | { timeZone?: string; events: FullCalendarEvent[] } }[];
}

export async function drupalFullCalendar(source: DrupalFullCalendarSource, window: DateWindow): Promise<ScrapedSession[]> {
	const html = await getText(source.url);
	const json = html.match(/<script type="application\/json" data-drupal-selector="drupal-settings-json">([\s\S]*?)<\/script>/)?.[1];
	if (!json) throw new Error('Drupal: drupal-settings-json not found (layout changed?)');
	const views = (JSON.parse(json) as DrupalSettings).fullCalendarView;
	if (!views?.length) throw new Error('Drupal: no fullCalendarView in page settings');

	const sessions: ScrapedSession[] = [];
	for (const view of views) {
		const options = typeof view.calendar_options === 'string' ? JSON.parse(view.calendar_options) : view.calendar_options;
		if (options.timeZone && options.timeZone !== 'America/Detroit') {
			throw new Error(`Drupal: unexpected calendar timeZone "${options.timeZone}"`);
		}

		for (const event of options.events as FullCalendarEvent[]) {
			const title = event.title.trim();
			const type = classify(title);
			if (!type || event.allDay || /cancel/i.test(title)) continue;
			const day = event.start.slice(0, 10);
			if (day < window.from || day > window.to) continue;

			const { name, arena } = parseTitle(title);
			sessions.push({
				sourceId: `drupal:${event.eid}`,
				type,
				title: arena ? `${name} (${arena})` : name,
				startsAt: detroitToUtc(event.start).toISOString(),
				endsAt: event.end ? detroitToUtc(event.end).toISOString() : null,
				ageGroup: ageGroupFrom(title),
				priceCents: null,
				bookingUrl: new URL(event.url, source.url).href,
				sourceUrl: source.url
			});
		}
	}
	return sessions;
}

/** "(Category) @ Edgar B arena, Name" → { name: "Name", arena: "Edgar B" } */
function parseTitle(title: string) {
	const m = title.match(/^\([^)]*\)(?:\s*@\s*(.+?)\s+arena)?,\s*(.+)$/i);
	return m ? { name: m[2].trim(), arena: m[1]?.trim() } : { name: title, arena: undefined };
}
