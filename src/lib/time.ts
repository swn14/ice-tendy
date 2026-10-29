export const TIME_ZONE = 'America/Detroit';

/** YYYY-MM-DD for the given instant in Detroit time. */
export function localDate(d: Date = new Date()) {
	return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(d);
}

export function formatTime(iso: string) {
	return new Intl.DateTimeFormat('en-US', {
		timeZone: TIME_ZONE,
		hour: 'numeric',
		minute: '2-digit'
	}).format(new Date(iso));
}

/** Shift a YYYY-MM-DD date by whole days. */
export function addDays(ymd: string, days: number) {
	const [y, m, d] = ymd.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Detroit wall time for an instant, as zone-less "YYYY-MM-DDTHH:MM:SS". */
export function detroitWallTime(d: Date) {
	return new Date(d.getTime() + detroitOffsetMinutes(d) * 60000).toISOString().slice(0, 19);
}

/** Minutes Detroit is offset from UTC at the given instant (e.g. -240 during EDT). */
function detroitOffsetMinutes(d: Date) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: TIME_ZONE,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(d);
	const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
	const wallAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
	return (wallAsUtc - d.getTime()) / 60000;
}

/** Interpret a zone-less "YYYY-MM-DDTHH:MM[:SS]" as Detroit wall time and return the UTC instant. */
export function detroitToUtc(wallTime: string) {
	const wallAsUtc = new Date(`${wallTime}Z`).getTime();
	const first = wallAsUtc - detroitOffsetMinutes(new Date(wallAsUtc)) * 60000;
	// Re-check at the candidate instant in case we straddled a DST change.
	return new Date(wallAsUtc - detroitOffsetMinutes(new Date(first)) * 60000);
}
