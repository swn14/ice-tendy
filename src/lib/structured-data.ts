// schema.org JSON-LD builders. Sessions from hand-entered weekly schedules ("manual" rinks) are
// never emitted as Events: their dates are typical, not confirmed, and search engines would
// surface them as fact.
import { SITE } from './site.ts';
import { SESSION_TYPE_LABELS, type Rink, type Session } from './types.ts';

/** "2121 Oak Valley Dr, Ann Arbor, MI 48103" → PostalAddress; anything else stays text. */
function postalAddress(address: string | null) {
	const m = address?.match(/^(.+?),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5})$/);
	if (!m) return address ?? undefined;
	return {
		'@type': 'PostalAddress',
		streetAddress: m[1],
		addressLocality: m[2],
		addressRegion: m[3],
		postalCode: m[4],
		addressCountry: 'US'
	};
}

export function website(origin: string) {
	return { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, description: SITE.tagline, url: `${origin}/` };
}

export function iceRink(rink: Rink, origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'IceRink',
		name: rink.name,
		address: postalAddress(rink.address),
		geo: { '@type': 'GeoCoordinates', latitude: rink.lat, longitude: rink.lng },
		url: `${origin}/rinks/${rink.id}`,
		sameAs: rink.website ?? undefined
	};
}

export function sessionEvents(sessions: Session[], rink: Rink, origin: string) {
	if (rink.adapter === 'manual') return [];
	return sessions.map((s) => {
		const url = s.booking_url ?? rink.schedule_url ?? undefined;
		return {
			'@context': 'https://schema.org',
			'@type': 'Event',
			name: `${SESSION_TYPE_LABELS[s.type]} at ${rink.name}`,
			description: [s.title, s.age_group && s.age_group !== 'all' ? `${s.age_group}s` : null].filter(Boolean).join(' · ') || undefined,
			startDate: s.starts_at,
			endDate: s.ends_at ?? undefined,
			eventStatus: 'https://schema.org/EventScheduled',
			eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
			location: { '@type': 'Place', name: rink.name, address: postalAddress(rink.address) },
			organizer: { '@type': 'Organization', name: rink.name, url: rink.website ?? undefined },
			image: `${origin}/og.png`,
			url,
			offers:
				s.price_cents == null
					? undefined
					: { '@type': 'Offer', price: (s.price_cents / 100).toFixed(2), priceCurrency: 'USD', url }
		};
	});
}
