// Generic iCalendar (.ics) feed — CivicPlus iCalendar.aspx, Trumba, Google Calendar, etc.
// Supports the recurrence subset these feeds use: FREQ=DAILY|WEEKLY with INTERVAL, BYDAY,
// UNTIL, COUNT, plus EXDATE and RECURRENCE-ID overrides. Recurrences are expanded in Detroit
// wall time so sessions keep their local start across DST changes. Anything else that could
// produce sessions in the window is rejected loudly rather than silently dropped.
import { addDays, detroitToUtc, detroitWallTime } from '../../src/lib/time.ts';
import { ageGroupFrom, classify } from '../classify.ts';
import { getText } from '../http.ts';
import type { DateWindow, ICalSource, ScrapedSession } from '../types.ts';

// TZIDs we can treat as Detroit wall time.
const EASTERN_TZIDS = new Set(['America/Detroit', 'America/New_York', 'US/Eastern', 'Eastern Standard Time']);
const BYDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

interface Prop {
	params: Record<string, string>;
	value: string;
}

type VEvent = Map<string, Prop[]>;

/** One concrete occurrence, in Detroit wall time ("YYYY-MM-DDTHH:MM:SS"). */
interface Occurrence {
	event: VEvent;
	key: string; // sourceId suffix
	start: string;
	end: string | null;
}

export async function ical(source: ICalSource, window: DateWindow): Promise<ScrapedSession[]> {
	const events = parseEvents(await getText(source.url));

	// RECURRENCE-ID entries replace one occurrence of their master series.
	const overridden = new Set<string>();
	for (const event of events) {
		const rid = first(event, 'RECURRENCE-ID');
		if (rid) overridden.add(`${uid(event)}@${wallTime(rid)}`);
	}

	const occurrences: Occurrence[] = [];
	for (const event of events) {
		const dtstart = first(event, 'DTSTART');
		if (!dtstart || dtstart.params.VALUE === 'DATE') continue; // all-day entries aren't sessions
		const start = wallTime(dtstart);
		const dtend = first(event, 'DTEND');
		const end = dtend ? wallTime(dtend) : null;
		const rid = first(event, 'RECURRENCE-ID');
		const rrule = first(event, 'RRULE');

		if (rid) occurrences.push({ event, key: `${uid(event)}@${wallTime(rid)}`, start, end });
		else if (!rrule) occurrences.push({ event, key: uid(event) ?? start, start, end });
		else if (classify(text(first(event, 'SUMMARY')) ?? '')) {
			// Only expand series that are themselves sessions; overrides are classified on their own.
			const exdates = new Set(all(event, 'EXDATE').flatMap((p) => p.value.split(',').map((v) => wallTime({ ...p, value: v }))));
			const minutes = end ? minutesBetween(start, end) : null;
			for (const occ of expand(rrule.value, start, window, () => text(first(event, 'SUMMARY')) ?? '')) {
				const key = `${uid(event)}@${occ}`;
				if (exdates.has(occ) || overridden.has(key)) continue;
				occurrences.push({ event, key, start: occ, end: minutes == null ? null : addMinutes(occ, minutes) });
			}
		}
	}

	const sessions: ScrapedSession[] = [];
	for (const { event, key, start, end } of occurrences) {
		const day = start.slice(0, 10);
		if (day < window.from || day > window.to) continue;
		const summary = text(first(event, 'SUMMARY'));
		const type = summary ? classify(summary) : null;
		if (!type || text(first(event, 'STATUS'))?.toUpperCase() === 'CANCELLED' || /cancel/i.test(summary!)) continue;

		const description = text(first(event, 'DESCRIPTION')) ?? '';
		const price = description.match(/\$\s?(\d+(?:\.\d{2})?)/);
		sessions.push({
			sourceId: `ical:${key}`,
			type,
			title: summary!,
			startsAt: detroitToUtc(start).toISOString(),
			endsAt: end ? detroitToUtc(end).toISOString() : null,
			ageGroup: ageGroupFrom(summary!),
			priceCents: price ? Math.round(Number(price[1]) * 100) : null,
			bookingUrl: description.match(/https?:\/\/\S+/)?.[0] ?? null,
			sourceUrl: source.url
		});
	}
	return sessions;
}

/** Occurrence start wall times of an RRULE series that could land in the window. */
function expand(rrule: string, start: string, window: DateWindow, describe: () => string): string[] {
	const rule = Object.fromEntries(rrule.split(';').map((part) => part.split('=') as [string, string]));
	const until = rule.UNTIL ? untilWallTime(rule.UNTIL) : null;
	const last = until && until.slice(0, 10) < window.to ? until.slice(0, 10) : addDays(window.to, 1);
	// A series that ended before the window or starts after it can't matter, whatever its rule.
	if (last < window.from || start.slice(0, 10) > window.to) return [];

	const unsupported = Object.keys(rule).filter((k) => !['FREQ', 'INTERVAL', 'BYDAY', 'UNTIL', 'COUNT', 'WKST'].includes(k));
	if ((rule.FREQ !== 'DAILY' && rule.FREQ !== 'WEEKLY') || unsupported.length || /\d/.test(rule.BYDAY ?? '')) {
		throw new Error(`iCal: unsupported recurrence "${rrule}" on "${describe()}"`);
	}

	const interval = Number(rule.INTERVAL ?? 1);
	const count = rule.COUNT ? Number(rule.COUNT) : Infinity;
	const startDay = start.slice(0, 10);
	const time = start.slice(11);
	const byDay = rule.BYDAY ? rule.BYDAY.split(',').map((d) => BYDAY_CODES.indexOf(d)) : [weekday(startDay)];
	const startWeek = mondayOf(startDay);

	const out: string[] = [];
	let n = 0;
	// Walk day by day from the series start so COUNT is honored (EXDATEs still count, per RFC 5545).
	for (let day = startDay; day <= last && n < count; day = addDays(day, 1)) {
		const matches =
			rule.FREQ === 'DAILY'
				? daysBetween(startDay, day) % interval === 0
				: byDay.includes(weekday(day)) && (daysBetween(startWeek, mondayOf(day)) / 7) % interval === 0;
		if (!matches) continue;
		const occ = `${day}T${time}`;
		if (until && occ > until) break;
		n++;
		if (day >= addDays(window.from, -1)) out.push(occ);
	}
	return out;
}

function parseEvents(ics: string): VEvent[] {
	// Unfold continuation lines (RFC 5545 §3.1), then walk VEVENT blocks.
	const lines = ics.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
	const events: VEvent[] = [];
	let current: VEvent | null = null;

	for (const line of lines) {
		if (line === 'BEGIN:VEVENT') current = new Map();
		else if (line === 'END:VEVENT') {
			if (current) events.push(current);
			current = null;
		} else if (current) {
			const colon = line.indexOf(':');
			if (colon < 0) continue;
			const [name, ...paramParts] = line.slice(0, colon).split(';');
			const params = Object.fromEntries(paramParts.map((p) => p.split('=') as [string, string]));
			const key = name.toUpperCase();
			current.set(key, [...(current.get(key) ?? []), { params, value: line.slice(colon + 1) }]);
		}
	}
	return events;
}

const first = (event: VEvent, name: string) => event.get(name)?.[0];
const all = (event: VEvent, name: string) => event.get(name) ?? [];
const uid = (event: VEvent) => text(first(event, 'UID'));

function text(prop: Prop | undefined) {
	return prop?.value
		.replace(/\\n/gi, '\n')
		.replace(/\\([,;\\])/g, '$1')
		.trim();
}

/** A DATE-TIME property as Detroit wall time. */
function wallTime({ params, value }: Prop) {
	const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?$/);
	if (!m) throw new Error(`iCal: unsupported date-time "${value}"`);
	const [, y, mo, d, h = '00', mi = '00', s = '00', z] = m;
	const wall = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
	if (z) return detroitWallTime(new Date(`${wall}Z`));
	if (params.TZID && !EASTERN_TZIDS.has(params.TZID)) throw new Error(`iCal: unsupported TZID "${params.TZID}"`);
	return wall; // TZID'd Eastern, floating, or a DATE
}

function untilWallTime(until: string) {
	const wall = wallTime({ params: {}, value: until });
	return /^\d{8}$/.test(until) ? `${wall.slice(0, 10)}T23:59:59` : wall;
}

function weekday(day: string) {
	return new Date(`${day}T12:00:00Z`).getUTCDay();
}

function mondayOf(day: string) {
	return addDays(day, -((weekday(day) + 6) % 7));
}

function daysBetween(a: string, b: string) {
	return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

function minutesBetween(a: string, b: string) {
	return (Date.parse(`${b}Z`) - Date.parse(`${a}Z`)) / 60000;
}

function addMinutes(wall: string, minutes: number) {
	return new Date(Date.parse(`${wall}Z`) + minutes * 60000).toISOString().slice(0, 19);
}
