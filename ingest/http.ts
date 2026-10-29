const USER_AGENT = 'ice-tendy/0.1 (personal schedule aggregator)';

async function get(url: string, accept: string) {
	const res = await fetch(url, {
		headers: { 'User-Agent': USER_AGENT, Accept: accept },
		signal: AbortSignal.timeout(30_000)
	});
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
	return res;
}

export async function getJson<T>(url: string): Promise<T> {
	// JSON:API servers (DaySmart) answer 406 unless their media type is acceptable.
	return (await get(url, 'application/json, application/vnd.api+json')).json() as Promise<T>;
}

export async function getText(url: string): Promise<string> {
	return (await get(url, 'text/html')).text();
}
