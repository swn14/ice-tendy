// Frontline Connect (frontline-connect.com) — used by Troy Sports Center. Each public session
// category has a server-rendered month calendar, one table cell per day listing the sheet of ice
// and zone-less Detroit-local times:
//   GET https://<tenant>.frontline-connect.com/monthlysched.cfm?fac=<fac>&facid=<facid>&session=<id>&month=M&year=YYYY
// The category ids come from the "Schedules" menu on that site (monthlyEvents.cfm?...&session=<id>).
import { addDays, detroitToUtc } from '../../src/lib/time.ts';
import { getText } from '../http.ts';
import type { DateWindow, FrontlineSource, ScrapedSession } from '../types.ts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A day cell, its hidden date label, and in document order the sheet headers and session times.
const CELL = /<td valign="top" id="\d+">([\s\S]*?)<\/td>/g;
const CELL_DATE = /id="spandt\d+">\s*([A-Z][a-z]{2}) (\d{2}) (\d{4})\s*</;
const CELL_ITEM =
	/<div class="surfdiv[^"]*">\s*<strong>([^<]*)<\/strong>|<div class="sessdiv[^"]*">\s*(\d{1,2}:\d{2} [AP]M)\s*-\s*(\d{1,2}:\d{2} [AP]M)/g;

export async function frontline(source: FrontlineSource, window: DateWindow): Promise<ScrapedSession[]> {
	const sessions = new Map<string, ScrapedSession>();

	for (const category of source.sessions) {
		for (const { month, year } of monthsIn(window)) {
			const params = new URLSearchParams({
				fac: source.fac,
				facid: String(source.facid),
				month: String(month),
				year: String(year),
				session: String(category.id)
			});
			const url = `${source.baseUrl}/monthlysched.cfm?${params}`;
			const html = await getText(url);
			const name = sessionName(html);

			// Month pages also show the leading/trailing days of neighbouring months; the map dedupes.
			for (const slot of parseSlots(html)) {
				if (slot.date < window.from || slot.date > window.to) continue;
				const sourceId = `frontline:${source.fac}:${category.id}:${slot.date}T${slot.start}:${slot.sheet}`;
				const endDate = slot.end <= slot.start ? addDays(slot.date, 1) : slot.date;
				sessions.set(sourceId, {
					sourceId,
					type: category.type,
					title: slot.sheet ? `${name} (${titleCase(slot.sheet)})` : name,
					startsAt: detroitToUtc(`${slot.date}T${slot.start}`).toISOString(),
					endsAt: detroitToUtc(`${endDate}T${slot.end}`).toISOString(),
					ageGroup: category.ageGroup ?? null,
					priceCents: category.priceCents ?? null,
					bookingUrl: null,
					sourceUrl: url
				});
			}
		}
	}

	return [...sessions.values()];
}

interface Slot {
	date: string; // YYYY-MM-DD
	start: string; // HH:MM, Detroit local
	end: string;
	sheet: string; // "RINK 2", or '' if the cell had no sheet header
}

function parseSlots(html: string): Slot[] {
	const slots: Slot[] = [];
	let cells = 0;
	for (const [, cell] of html.matchAll(CELL)) {
		const d = cell.match(CELL_DATE);
		if (!d) continue;
		cells++;
		const date = `${d[3]}-${String(MONTHS.indexOf(d[1]) + 1).padStart(2, '0')}-${d[2]}`;
		let sheet = '';
		for (const [, header, start, end] of cell.matchAll(CELL_ITEM)) {
			if (header !== undefined) sheet = header.trim();
			else slots.push({ date, start: to24h(start), end: to24h(end), sheet });
		}
	}
	if (!cells) throw new Error('Frontline: no calendar day cells found (layout changed?)');
	return slots;
}

/** The category heading above the calendar, e.g. "ADULT DROP-IN". */
function sessionName(html: string) {
	const name = html.match(/<div id="sessiondesc"[^>]*>\s*<h4>([^<]+)<\/h4>/)?.[1].trim();
	return name ? titleCase(name) : 'Session';
}

/** "12:15 PM" -> "12:15" */
function to24h(time: string) {
	const [, h, m, meridiem] = time.match(/(\d{1,2}):(\d{2}) ([AP])M/)!;
	const hour = (Number(h) % 12) + (meridiem === 'P' ? 12 : 0);
	return `${String(hour).padStart(2, '0')}:${m}`;
}

function titleCase(text: string) {
	return text.toLowerCase().replace(/(^|[\s/(-])([a-z])/g, (_, pre: string, c: string) => pre + c.toUpperCase());
}

function monthsIn(window: DateWindow) {
	const months: { month: number; year: number }[] = [];
	let [year, month] = window.from.split('-').map(Number);
	const [toYear, toMonth] = window.to.split('-').map(Number);
	while (year < toYear || (year === toYear && month <= toMonth)) {
		months.push({ month, year });
		if (++month > 12) [month, year] = [1, year + 1];
	}
	return months;
}
