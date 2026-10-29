import type { DateWindow, ScrapedSession, Source } from '../types.ts';
import { activityreg } from './activityreg.ts';
import { bond } from './bond.ts';
import { daysmart } from './daysmart.ts';
import { drupalFullCalendar } from './drupal-fullcalendar.ts';
import { finnly } from './finnly.ts';
import { frontline } from './frontline.ts';
import { ical } from './ical.ts';
import { manual } from './manual.ts';

export function scrape(source: Source, window: DateWindow): Promise<ScrapedSession[]> {
	switch (source.adapter) {
		case 'bond':
			return bond(source, window);
		case 'finnly':
			return finnly(source, window);
		case 'daysmart':
			return daysmart(source, window);
		case 'ical':
			return ical(source, window);
		case 'drupal-fullcalendar':
			return drupalFullCalendar(source, window);
		case 'frontline':
			return frontline(source, window);
		case 'activityreg':
			return activityreg(source, window);
		case 'manual':
			return manual(source, window);
	}
}
