// ActivityReg (activityreg.com), legacy "t2" registration pages — used by Garden City Parks & Rec.
// Time-slot programs (e.g. Sticks and Pucks) expose public, unauthenticated HTML fragments:
//   GET https://<site>.activityreg.com/SelectActivity_Slots_t2.wcs?leaguesid=N
//     -> program name + every date with a session (hidden #calDateList, "MM/DD/YYYY,...")
//   GET https://<site>.activityreg.com/GetTimeSlotOpenings_T1.WCS?parms=N:MM/DD/YYYY:<cache-buster>
//     -> table of that day's slots: "Sun 10:30am-12:00pm", capacity, open spots, fee, slot id
// Sites migrated to the newer React app (POST api.activityreg.com/pages/...) redirect away from
// these pages and are not supported here.
import { detroitToUtc } from '../../src/lib/time.ts';
import { ageGroupFrom } from '../classify.ts';
import { getText } from '../http.ts';
import type { ActivityRegSource, DateWindow, ScrapedSession } from '../types.ts';

interface Slot {
	slotId: string | null;
	start: string; // "HH:MM", Detroit local
	end: string;
	priceCents: number | null;
}

export async function activityreg(source: ActivityRegSource, window: DateWindow): Promise<ScrapedSession[]> {
	const base = `https://${source.site}.activityreg.com`;
	const sessions: ScrapedSession[] = [];

	for (const { leagueId, type } of source.leagues) {
		const programUrl = `${base}/SelectActivity_Slots_t2.wcs?leaguesid=${leagueId}`;
		const { title, dates } = parseProgram(await getText(programUrl), programUrl);
		const ageGroup = title ? ageGroupFrom(title) : null;

		// One request per session date, sequentially, to stay gentle on the server.
		for (const date of dates.filter((d) => d >= window.from && d <= window.to)) {
			const [y, m, d] = date.split('-');
			const openingsUrl = `${base}/GetTimeSlotOpenings_T1.WCS?parms=${leagueId}:${m}/${d}/${y}:${Date.now()}`;
			for (const slot of parseSlots(await getText(openingsUrl))) {
				sessions.push({
					sourceId: `activityreg:${source.site}:${slot.slotId ?? `${leagueId}:${date}T${slot.start}`}`,
					type,
					title,
					startsAt: detroitToUtc(`${date}T${slot.start}`).toISOString(),
					endsAt: detroitToUtc(`${date}T${slot.end}`).toISOString(),
					ageGroup,
					priceCents: slot.priceCents,
					bookingUrl: `${base}/selectactivity_t2.wcs?leaguesid=${leagueId}`,
					sourceUrl: programUrl
				});
			}
		}
	}

	return sessions;
}

function parseProgram(html: string, url: string) {
	const list = html.match(/value="([^"]*)"\s+id="calDateList"/);
	if (!list) throw new Error(`ActivityReg: no session date list at ${url} (program retired or site migrated?)`);
	const heading = html.match(/<h3>\s*<b>(?:<img[^>]*>)?([^<]+)<\/b>/);
	const dates = list[1]
		.split(',')
		.map((s) => s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/))
		.filter((m) => m !== null)
		.map(([, mm, dd, yyyy]) => `${yyyy}-${mm}-${dd}`);
	return { title: heading ? decode(heading[1]) : null, dates };
}

function parseSlots(html: string): Slot[] {
	const slots: Slot[] = [];
	for (const row of html.split(/<tr\b/i).slice(1)) {
		const time = row.match(/<td[^>]*>\s*[A-Z][a-z]{2}\s+(\d{1,2}:\d{2}\s*[ap]m)\s*-\s*(\d{1,2}:\d{2}\s*[ap]m)/i);
		if (!time) continue; // header row
		const fee = row.match(/\$\s*(\d+(?:\.\d{2})?)/);
		// Registration and waitlist links both carry the per-occurrence slot id.
		const id = row.match(/GotoSlot(?:Registration|WaitList)\('(\d+)'/i);
		slots.push({
			slotId: id ? id[1] : null,
			start: to24h(time[1]),
			end: to24h(time[2]),
			priceCents: fee ? Math.round(Number(fee[1]) * 100) : null
		});
	}
	return slots;
}

/** "1:30pm" -> "13:30" */
function to24h(text: string) {
	const [, h, min, ampm] = text.toLowerCase().match(/(\d{1,2}):(\d{2})\s*([ap])m/)!;
	const hour = (Number(h) % 12) + (ampm === 'p' ? 12 : 0);
	return `${String(hour).padStart(2, '0')}:${min}`;
}

function decode(text: string) {
	return text.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
