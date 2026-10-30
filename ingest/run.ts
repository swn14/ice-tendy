// Local test runner for the schedule scrapers.
//
//   node ingest/run.ts                      # scrape all rinks, next 14 days, print results
//   node ingest/run.ts --rink bcic-chelsea  # one rink (repeatable)
//   node ingest/run.ts --days 7 --json      # raw JSON output
//   node ingest/run.ts --write              # also save to the local D1 database (wrangler dev state)
//   node ingest/run.ts --write --remote     # save to the production D1 database instead; needs
//                                           # CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (or `wrangler login`)
import { parseArgs } from 'node:util';
import { SESSION_TYPE_LABELS } from '../src/lib/types.ts';
import { addDays, formatTime, localDate } from '../src/lib/time.ts';
import { scrape } from './adapters/index.ts';
import { RINKS } from './rinks.ts';
import { clearSampleData, saveRink, type Outcome } from './store.ts';
import type { DateWindow, RinkConfig } from './types.ts';

const { values: args } = parseArgs({
	options: {
		days: { type: 'string', default: '14' },
		rink: { type: 'string', multiple: true },
		json: { type: 'boolean', default: false },
		write: { type: 'boolean', default: false },
		remote: { type: 'boolean', default: false }
	}
});

if (args.remote && !args.write) {
	console.error('--remote only applies together with --write');
	process.exit(1);
}

const from = localDate();
const window: DateWindow = { from, to: addDays(from, Number(args.days) - 1) };

const rinks = args.rink ? RINKS.filter((r) => args.rink!.includes(r.id)) : RINKS;
const unknown = args.rink?.filter((id) => !RINKS.some((r) => r.id === id)) ?? [];
if (unknown.length) {
	console.error(`Unknown rink id(s): ${unknown.join(', ')}\nKnown: ${RINKS.map((r) => r.id).join(', ')}`);
	process.exit(1);
}

const results: { rink: RinkConfig; outcome: Outcome }[] = [];
for (const rink of rinks) {
	try {
		const scraped = await scrape(rink.source, window);
		// Trim to the window by Detroit-local date and drop duplicates.
		const seen = new Set<string>();
		const sessions = scraped
			.filter((s) => {
				const day = localDate(new Date(s.startsAt));
				if (day < window.from || day > window.to || seen.has(s.sourceId)) return false;
				seen.add(s.sourceId);
				return true;
			})
			.map((s) => ({ ...s, priceCents: s.priceCents ?? rink.prices?.[s.type] ?? null }))
			.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
		results.push({ rink, outcome: { ok: true, sessions } });
	} catch (err) {
		results.push({ rink, outcome: { ok: false, error: err instanceof Error ? err.message : String(err) } });
	}
}

if (args.json) {
	console.log(JSON.stringify({ window, results: results.map(({ rink, outcome }) => ({ rink: rink.id, ...outcome })) }, null, 2));
} else {
	console.log(`Window: ${window.from} → ${window.to}\n`);
	for (const { rink, outcome } of results) printRink(rink, outcome);
}

if (args.write) {
	// Locally: the binding the SvelteKit dev server uses, backed by .wrangler/state.
	// Remotely: the "ingest" wrangler environment, whose DB binding is marked remote.
	const { getPlatformProxy } = await import('wrangler');
	const platform = await getPlatformProxy<Env>(args.remote ? { environment: 'ingest' } : {});
	try {
		await clearSampleData(platform.env.DB);
		let changed = 0;
		for (const { rink, outcome } of results) if (await saveRink(platform.env.DB, rink, window, outcome)) changed++;
		console.log(`Saved ${results.length} rink(s) to ${args.remote ? 'production' : 'local'} D1 (${changed} changed).`);
	} finally {
		await platform.dispose();
	}
}

if (results.some((r) => !r.outcome.ok)) process.exitCode = 1;

function printRink(rink: RinkConfig, outcome: Outcome) {
	if (!outcome.ok) {
		console.log(`✗ ${rink.name}\n    ${outcome.error}\n`);
		return;
	}
	const counts = Object.entries(SESSION_TYPE_LABELS)
		.map(([type, label]) => `${outcome.sessions.filter((s) => s.type === type).length} ${label}`)
		.join(', ');
	console.log(`✓ ${rink.name} — ${counts}`);
	let lastDay = '';
	for (const s of outcome.sessions) {
		const day = localDate(new Date(s.startsAt));
		const dayLabel = day === lastDay ? '' : new Date(`${day}T12:00:00Z`).toUTCString().slice(0, 11);
		lastDay = day;
		const time = `${formatTime(s.startsAt)}${s.endsAt ? `–${formatTime(s.endsAt)}` : ''}`;
		const extras = [s.ageGroup, s.priceCents != null ? `$${s.priceCents / 100}` : null].filter(Boolean).join(' · ');
		console.log(`    ${dayLabel.padEnd(11)} ${time.padEnd(18)} ${SESSION_TYPE_LABELS[s.type].padEnd(15)} ${extras}`);
	}
	console.log();
}
