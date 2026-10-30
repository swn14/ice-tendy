import { env } from 'cloudflare:workers';
import { activeRinks } from '#lib/server/db.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const rinks = await activeRinks(env.DB);
	// changed_at, not last_checked_at: search engines stop trusting a <lastmod> that moves on every crawl.
	const lastChanged = rinks.map((r) => r.changed_at).filter((d): d is string => !!d).sort().at(-1);

	const entries = [
		{ path: '/', lastmod: lastChanged },
		{ path: '/rinks', lastmod: lastChanged },
		...rinks.map((r) => ({ path: `/rinks/${r.id}`, lastmod: r.changed_at }))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		({ path, lastmod }) =>
			`  <url><loc>${url.origin}${path}</loc>${lastmod ? `<lastmod>${lastmod.replace(/\.\d+Z$/, 'Z')}</lastmod>` : ''}</url>`
	)
	.join('\n')}
</urlset>
`;

	return new Response(xml, {
		headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
};
