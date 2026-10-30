// Writes fake rinks + sessions for the next 7 days to seed/dev.sql. Local dev only — never apply remotely.
import { writeFileSync } from 'node:fs';

const rinks = [
	['sample-a2', 'Sample Arena (Ann Arbor)', 'Ann Arbor', 42.2875, -83.7743],
	['sample-ypsi', 'Sample Ice Center (Ypsilanti)', 'Ypsilanti', 42.2411, -83.6129],
	['sample-canton', 'Sample Sports Complex (Canton)', 'Canton', 42.2822, -83.4977]
];

// [rink, type, local start hour, minutes long, age, price cents]
const daily = [
	['sample-a2', 'sticks_pucks', 11.5, 90, 'all', 1200],
	['sample-a2', 'drop_in', 21.25, 75, 'adult', 1500],
	['sample-ypsi', 'sticks_pucks', 13, 60, 'youth', 1000],
	['sample-canton', 'drop_in', 6, 60, 'adult', 1400],
	['sample-canton', 'sticks_pucks', 15, 80, 'all', 1500]
];

const q = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

// Convert a Detroit wall-clock time to a UTC instant.
function detroitToUtc(ymd, hour) {
	const [y, m, d] = ymd.split('-').map(Number);
	const guess = new Date(Date.UTC(y, m - 1, d, Math.floor(hour), Math.round((hour % 1) * 60)));
	const asDetroit = new Date(guess.toLocaleString('en-US', { timeZone: 'America/Detroit' }));
	const asUtc = new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }));
	return new Date(guess.getTime() + (asUtc - asDetroit));
}

const now = new Date().toISOString();
const lines = ['DELETE FROM sessions WHERE rink_id LIKE \'sample-%\';', "DELETE FROM rinks WHERE id LIKE 'sample-%';"];
for (const [id, name, city, lat, lng] of rinks) {
	lines.push(
		`INSERT INTO rinks (id, name, city, lat, lng, schedule_url, last_checked_at, changed_at) VALUES (${[id, name, city, lat, lng, 'https://example.com', now, now].map(q).join(', ')});`
	);
}
for (let i = 0; i < 7; i++) {
	const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Detroit' }).format(new Date(Date.now() + i * 86400000));
	for (const [rink, type, hour, mins, age, price] of daily) {
		const start = detroitToUtc(ymd, hour);
		const end = new Date(start.getTime() + mins * 60000);
		lines.push(
			`INSERT INTO sessions (id, rink_id, type, starts_at, ends_at, local_date, age_group, price_cents, fetched_at) VALUES (${[`${rink}-${type}-${ymd}`, rink, type, start.toISOString(), end.toISOString(), ymd, age, price, now].map(q).join(', ')});`
		);
	}
}
writeFileSync(new URL('../seed/dev.sql', import.meta.url), lines.join('\n') + '\n');
console.log(`wrote seed/dev.sql (${lines.length} statements)`);
