import type { AgeGroup, SessionType } from '../src/lib/types.ts';

/** Inclusive range of Detroit-local dates, YYYY-MM-DD. */
export interface DateWindow {
	from: string;
	to: string;
}

/** What an adapter returns for one session, before it is tied to a rink row. */
export interface ScrapedSession {
	sourceId: string; // unique within the rink, stable across runs
	type: SessionType;
	title: string | null;
	startsAt: string; // ISO 8601 UTC
	endsAt: string | null;
	ageGroup: AgeGroup | null;
	priceCents: number | null;
	bookingUrl: string | null;
	sourceUrl: string;
}

export interface BondSource {
	adapter: 'bond';
	/** Bond Sports program ids. Seasons under each program are discovered at run time. */
	programs: { programId: number; type: SessionType }[];
}

export interface FinnlySource {
	adapter: 'finnly';
	/** Public facility schedule page, e.g. https://<org>.finnlyconnect.com/schedule/<id> */
	scheduleUrl: string;
}

export interface DaySmartSource {
	adapter: 'daysmart';
	/** DaySmart Recreation tenant slug, as in apps.daysmartrecreation.com/dash/x/#/online/<company>/ */
	company: string;
	/**
	 * Event-type ids that hold public sessions (e.g. "Public Activities"). Required because
	 * rentals named after people ("<Name> Drop In") would otherwise match by name.
	 */
	eventTypes: string[];
}

export interface ICalSource {
	adapter: 'ical';
	url: string;
}

export interface DrupalFullCalendarSource {
	adapter: 'drupal-fullcalendar';
	/** Page whose drupal-settings-json embeds fullCalendarView events. */
	url: string;
}

export interface FrontlineSource {
	adapter: 'frontline';
	/** Tenant origin, e.g. https://troy.frontline-connect.com */
	baseUrl: string;
	fac: string;
	facid: number;
	/** Public session categories. Their calendars hold only that session, so no name matching is needed. */
	sessions: { id: number; type: SessionType; ageGroup?: AgeGroup; priceCents?: number }[];
}

export interface ActivityRegSource {
	adapter: 'activityreg';
	/** Subdomain, as in https://<site>.activityreg.com */
	site: string;
	/** Time-slot program ids ("leaguesid" in the registration links). */
	leagues: { leagueId: number; type: SessionType }[];
}

export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

/** A recurring weekly session copied by hand from a rink's published schedule. */
export interface ManualSession {
	days: Weekday[];
	start: string; // "09:30", Detroit local
	end: string;
	type: SessionType;
	title?: string;
	ageGroup?: AgeGroup;
	priceCents?: number;
	/** Inclusive YYYY-MM-DD bounds, when the rink publishes them. */
	from?: string;
	until?: string;
}

export interface ManualSource {
	adapter: 'manual';
	/** Where these times were published, for re-checking. */
	evidenceUrl: string;
	sessions: ManualSession[];
}

export type Source =
	| BondSource
	| FinnlySource
	| DaySmartSource
	| ICalSource
	| DrupalFullCalendarSource
	| FrontlineSource
	| ActivityRegSource
	| ManualSource;

export interface RinkConfig {
	id: string;
	name: string;
	city: string;
	address: string;
	lat: number;
	lng: number;
	website: string;
	/** Human-facing schedule/booking page shown in the app. */
	scheduleUrl: string;
	source: Source;
	/** Published prices, used when the source doesn't carry one. */
	prices?: Partial<Record<SessionType, number>>; // cents
}
