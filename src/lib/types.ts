export type SessionType = 'drop_in' | 'sticks_pucks';
export type AgeGroup = 'adult' | 'youth' | 'all';

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
	drop_in: 'Drop-in',
	sticks_pucks: 'Sticks & Pucks'
};

export interface Rink {
	id: string;
	name: string;
	city: string;
	address: string | null;
	lat: number;
	lng: number;
	website: string | null;
	schedule_url: string | null;
	adapter: string | null;
	last_checked_at: string | null;
}

export interface Session {
	id: string;
	rink_id: string;
	type: SessionType;
	title: string | null;
	starts_at: string;
	ends_at: string | null;
	local_date: string;
	age_group: AgeGroup | null;
	price_cents: number | null;
	booking_url: string | null;
	source_url: string | null;
	fetched_at: string;
}
