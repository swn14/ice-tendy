// DaySmart Recreation (formerly Dash). Public JSON:API, no auth:
//   GET https://apps.daysmartrecreation.com/dash/jsonapi/api/v1/events
//       ?company=<slug>&filter[start_date__gte]=YYYY-MM-DD&filter[start_date__lte]=YYYY-MM-DD
//       &include=resource&page[size]=N&page[number]=N
// The feed includes private rentals and lessons, often named after the renter, and some
// tenants mark those publish:true. Only published events of the configured public event types
// whose name reads as S&P/drop-in are kept.
import { ageGroupFrom, classify } from '../classify.ts';
import { getJson } from '../http.ts';
import type { DateWindow, DaySmartSource, ScrapedSession } from '../types.ts';

const API = 'https://apps.daysmartrecreation.com/dash/jsonapi/api/v1';
const PAGE_SIZE = 500;

interface DaySmartEvent {
	id: string;
	attributes: {
		event_type_id: string;
		desc: string | null; // event name
		start_gmt: string; // "2026-10-29T14:00:00", UTC without a zone suffix
		end_gmt: string;
		publish: boolean;
		resource_id: number | null;
	};
}

interface DaySmartPage {
	data: DaySmartEvent[];
	included?: { type: string; id: string; attributes: { name?: string } }[];
	meta: { page: { 'current-page': number; 'last-page': number } };
}

export async function daysmart(source: DaySmartSource, window: DateWindow): Promise<ScrapedSession[]> {
	const sessions: ScrapedSession[] = [];
	const params = new URLSearchParams({
		company: source.company,
		'filter[start_date__gte]': window.from,
		'filter[start_date__lte]': window.to,
		include: 'resource',
		sort: 'start',
		'page[size]': String(PAGE_SIZE)
	});

	for (let page = 1; ; page++) {
		params.set('page[number]', String(page));
		const res = await getJson<DaySmartPage>(`${API}/events?${params}`);
		const resources = new Map(
			(res.included ?? []).filter((i) => i.type === 'resources').map((i) => [Number(i.id), i.attributes.name?.trim()])
		);

		for (const event of res.data) {
			const { desc, publish, event_type_id, start_gmt, end_gmt, resource_id } = event.attributes;
			const name = desc?.trim();
			if (!publish || !name || !source.eventTypes.includes(String(event_type_id))) continue;
			const type = classify(name);
			if (!type) continue;

			const resource = resource_id == null ? undefined : resources.get(resource_id);
			sessions.push({
				sourceId: `daysmart:${event.id}`,
				type,
				title: resource ? `${name} (${resource})` : name,
				startsAt: new Date(`${start_gmt}Z`).toISOString(),
				endsAt: new Date(`${end_gmt}Z`).toISOString(),
				ageGroup: ageGroupFrom(name),
				priceCents: null,
				bookingUrl: null,
				sourceUrl: `https://apps.daysmartrecreation.com/dash/x/#/online/${source.company}/`
			});
		}

		if (res.meta.page['current-page'] >= res.meta.page['last-page']) return sessions;
	}
}
