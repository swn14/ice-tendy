import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	// The site lives on its custom domain. workers.dev and preview URLs (<version>-ice-tendy.<account>.workers.dev)
	// serve the same pages, and their canonical links point at themselves, so keep crawlers off them entirely.
	const body = url.hostname.endsWith('.workers.dev')
		? 'User-agent: *\nDisallow: /\n'
		: `User-agent: *
# The home page's ?date= and ?type= filters accept any date: an endless crawl space whose canonical is "/".
Disallow: /*?
# SvelteKit's client-side navigation data, not pages.
Disallow: /*__data.json

Sitemap: ${url.origin}/sitemap.xml
`;

	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' }
	});
};
