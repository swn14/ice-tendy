import type { RinkConfig } from './types.ts';

const BCIC = 'https://www.biggbycoffeeicecube.com';

// Nearest to Ann Arbor first. Bond program ids come from the "Book"/calendar embeds on each
// rink's site; they are long-lived, while the seasons under them roll over.
export const RINKS: RinkConfig[] = [
	{
		id: 'bcic-ann-arbor',
		name: 'Biggby Coffee Ice Cube – Ann Arbor',
		city: 'Ann Arbor',
		address: '2121 Oak Valley Dr, Ann Arbor, MI 48103',
		lat: 42.25424,
		lng: -83.77822,
		website: `${BCIC}/ann-arbor/home`,
		scheduleUrl: `${BCIC}/ann-arbor/adult-sticks-and-pucks-calendar`,
		source: {
			adapter: 'bond',
			programs: [
				{ programId: 2138, type: 'sticks_pucks' },
				{ programId: 2141, type: 'drop_in' } // "35+ Drop-In Hockey"
			]
		}
	},
	{
		id: 'a2-buhr-park',
		name: 'Buhr Park Ice Arena',
		city: 'Ann Arbor',
		address: '2751 Packard St, Ann Arbor, MI 48104',
		lat: 42.24896,
		lng: -83.71076,
		website: 'https://www.a2gov.org/parks-and-recreation/activities/ice-skate-and-play-hockey/',
		scheduleUrl: 'https://www.a2gov.org/parks-and-recreation/activities/ice-skate-and-play-hockey/',
		// Seasonal covered outdoor rink; the city's Trumba feed is empty until the season is posted.
		source: {
			adapter: 'ical',
			url: 'https://www.trumba.com/calendars/city-of-ann-arbor-events-parks-and-recreation-ice-skatinghockey.ics'
		}
	},
	{
		id: 'bcic-chelsea',
		name: 'Biggby Coffee Ice Cube – Chelsea (Arctic Coliseum)',
		city: 'Chelsea',
		address: '501 Coliseum Dr, Chelsea, MI 48118',
		lat: 42.30211,
		lng: -84.02742,
		website: `${BCIC}/chelsea/home`,
		scheduleUrl: `${BCIC}/chelsea/sticks-and-pucks-calendar`,
		source: {
			adapter: 'bond',
			programs: [
				{ programId: 6803, type: 'sticks_pucks' },
				{ programId: 16777, type: 'drop_in' } // "25+ Adult drop in Hockey"
			]
		}
	},
	{
		id: 'bcic-brighton',
		name: 'Biggby Coffee Ice Cube – Brighton (Kensington Valley Ice House)',
		city: 'Brighton',
		address: '10540 Citation Dr, Brighton, MI 48116',
		lat: 42.51857,
		lng: -83.74494,
		website: `${BCIC}/brighton/home`,
		scheduleUrl: `${BCIC}/brighton/sticks-and-pucks-calendar`,
		source: { adapter: 'bond', programs: [{ programId: 3701, type: 'sticks_pucks' }] },
		prices: { sticks_pucks: 1200 } // only on the season page, not in the API
	},
	{
		id: 'arctic-edge-canton',
		name: 'Arctic Edge Ice Arena',
		city: 'Canton',
		address: '46615 Michigan Ave, Canton, MI 48188',
		lat: 42.26889,
		lng: -83.49723,
		website: 'https://www.arcticarenas.com/',
		scheduleUrl: 'https://www.arcticarenas.com/page/show/3517364-sticks-and-pucks',
		// SportsEngine feed for the "Sticks & Pucks" calendar tag. Empty as of 2026-10-29; the rink
		// isn't posting S&P times anywhere right now, so this starts working once they tag events.
		source: { adapter: 'ical', url: 'https://www.arcticarenas.com/ical_feed?tags=3517364' },
		prices: { sticks_pucks: 1000 } // cash; $10.40 by card
	},
	{
		id: 'plymouth-cultural-center',
		name: 'Plymouth Cultural Center',
		city: 'Plymouth',
		address: '525 Farmer St, Plymouth, MI 48170',
		lat: 42.37701,
		lng: -83.46599,
		website: 'https://www.plymouthmi.gov/government/departments/recreation/ice_arena',
		scheduleUrl: 'https://www.dropinhockey.net/',
		// Silver Sticks senior drop-in, run by an outside organizer with BenchApp signup. Start
		// times are published; end times are estimated. Runs through March.
		source: {
			adapter: 'manual',
			evidenceUrl: 'https://www.dropinhockey.net/',
			sessions: [
				{ days: ['mon', 'fri'], start: '09:25', end: '10:25', type: 'drop_in', title: 'Silver Sticks Senior Drop-In (BenchApp signup)', ageGroup: 'adult', priceCents: 1500, from: '2026-09-14', until: '2027-03-31' },
				{ days: ['mon', 'fri'], start: '10:30', end: '11:30', type: 'drop_in', title: 'Silver Sticks Senior Drop-In (BenchApp signup)', ageGroup: 'adult', priceCents: 1500, from: '2026-09-14', until: '2027-03-31' }
			]
		}
	},
	{
		id: 'garden-city-civic-arena',
		name: 'Garden City Civic Ice Arena',
		city: 'Garden City',
		address: '200 Log Cabin Rd, Garden City, MI 48135',
		lat: 42.3117,
		lng: -83.34506,
		website: 'https://www.gardencitymi.org/799/Ice-Arena',
		scheduleUrl: 'https://www.gardencitymi.org/951/Sticks-and-Pucks',
		source: {
			adapter: 'activityreg',
			site: 'gardencityparks',
			leagues: [
				{ leagueId: 159, type: 'sticks_pucks' },
				{ leagueId: 324, type: 'drop_in' }
			]
		}
	},
	{
		id: 'westland-mike-modano',
		name: 'Mike Modano Ice Arena',
		city: 'Westland',
		address: '6210 N Wildwood St, Westland, MI 48185',
		lat: 42.33024,
		lng: -83.3796,
		website: 'https://cityofwestland.com/590/Mike-Modano-Ice-Arena',
		scheduleUrl: 'https://cityofwestland.com/calendar.aspx?CID=42',
		source: {
			adapter: 'ical',
			url: 'https://cityofwestland.com/common/modules/iCalendar/iCalendar.aspx?catID=42&feed=calendar'
		}
	},
	{
		id: 'livonia-eddie-edgar',
		name: 'Eddie Edgar Ice Arena',
		city: 'Livonia',
		address: '33841 Lyndon St, Livonia, MI 48154',
		lat: 42.38914,
		lng: -83.37727,
		website: 'https://www.eddieedgar.org',
		scheduleUrl: 'https://www.eddieedgar.org/skating-information/sticks-and-pucks',
		source: { adapter: 'drupal-fullcalendar', url: 'https://www.eddieedgar.org/schedule' },
		prices: { sticks_pucks: 800 }
	},
	{
		id: 'novi-ice-arena',
		name: 'Novi Ice Arena',
		city: 'Novi',
		address: '42400 Nick Lidstrom Dr, Novi, MI 48375',
		lat: 42.46011,
		lng: -83.46855,
		website: 'https://www.noviicearena.com',
		scheduleUrl: 'https://www.noviicearena.com/public-schedule',
		// The Wix page embeds this Google Calendar (page JSON → filesusr.com HTML embed → iframe src).
		source: {
			adapter: 'ical',
			url: 'https://calendar.google.com/calendar/ical/sinoviicearena%40gmail.com/public/basic.ics'
		},
		prices: { sticks_pucks: 2000 }
	},
	{
		id: 'suburban-ice-farmington-hills',
		name: 'Suburban Ice Farmington Hills',
		city: 'Farmington Hills',
		address: '23996 Freeway Park Dr, Farmington Hills, MI 48335',
		lat: 42.46591,
		lng: -83.42236,
		website: 'https://www.suburbanicefarmingtonhills.com',
		scheduleUrl: 'https://www.suburbanicefarmingtonhills.com/public-skating',
		// Same Wix → Google Calendar embed pattern as Novi.
		source: {
			adapter: 'ical',
			url: 'https://calendar.google.com/calendar/ical/sifarmingtonhills%40gmail.com/public/basic.ics'
		},
		prices: { sticks_pucks: 2000 }
	},
	{
		id: 'southfield-sports-arena',
		name: 'Southfield Sports Arena',
		city: 'Southfield',
		address: '26000 Evergreen Rd, Southfield, MI 48076',
		lat: 42.48349,
		lng: -83.23685,
		website: 'https://www.cityofsouthfield.com/departments/parks-recreation',
		scheduleUrl: 'https://www.cityofsouthfield.com/sites/default/files/2026-08/Fall26Web_3.pdf',
		// Fall 2026 Parks & Rec Activity Guide, p.5. Holiday closures aren't listed.
		source: {
			adapter: 'manual',
			evidenceUrl: 'https://www.cityofsouthfield.com/sites/default/files/2026-08/Fall26Web_3.pdf',
			sessions: [
				{ days: ['mon'], start: '10:30', end: '11:50', type: 'sticks_pucks', title: 'Sticks & Pucks', ageGroup: 'all', priceCents: 800, from: '2026-09-14', until: '2026-12-28' },
				{ days: ['wed'], start: '10:30', end: '11:50', type: 'sticks_pucks', title: 'Sticks & Pucks', ageGroup: 'all', priceCents: 800, from: '2026-09-09', until: '2026-12-30' },
				{ days: ['fri'], start: '10:30', end: '11:50', type: 'sticks_pucks', title: 'Sticks & Pucks', ageGroup: 'all', priceCents: 800, from: '2026-09-11', until: '2026-12-18' },
				{ days: ['sun'], start: '12:00', end: '13:20', type: 'sticks_pucks', title: 'Sticks & Pucks', ageGroup: 'all', priceCents: 800, from: '2026-09-13', until: '2026-12-27' }
			]
		}
	},
	{
		id: 'john-lindell-royal-oak',
		name: 'John Lindell Ice Arena – Royal Oak',
		city: 'Royal Oak',
		address: '1403 Lexington Blvd, Royal Oak, MI 48073',
		lat: 42.52109,
		lng: -83.16136,
		website: 'https://www.royaloakicearena.com',
		scheduleUrl: 'https://www.royaloakicearena.com/public-skating',
		// Wix page embedding a public Google Calendar; cancellations only show up in titles.
		source: { adapter: 'ical', url: 'https://calendar.google.com/calendar/ical/siroyaloak%40gmail.com/public/basic.ics' },
		// Drop-in is $15 daytime / $20 from 5 PM, so it's left unset.
		prices: { sticks_pucks: 2000 }
	},
	{
		id: 'detroit-skating-club',
		name: 'Detroit Skating Club',
		city: 'Bloomfield Hills',
		address: '888 Denison Ct, Bloomfield Hills, MI 48302',
		lat: 42.6083,
		lng: -83.29124,
		website: 'https://dscclub.com',
		scheduleUrl: 'https://dscclub.com/events/sticks-and-pucks',
		// A DaySmart tenant ("detroitskating"), but S&P isn't scheduled there; the event page is prose.
		source: {
			adapter: 'manual',
			evidenceUrl: 'https://dscclub.com/events/sticks-and-pucks',
			sessions: [{ days: ['sun'], start: '17:15', end: '18:15', type: 'sticks_pucks', title: 'Sticks and Pucks (C-Rink)', ageGroup: 'all', priceCents: 2000, from: '2026-09-06' }]
		}
	},
	{
		id: 'hazel-park-ice-arena',
		name: 'Hazel Park Ice Arena',
		city: 'Hazel Park',
		address: '1555 E Woodward Heights Blvd, Hazel Park, MI 48030',
		lat: 42.4695,
		lng: -83.08975,
		website: 'https://www.hazelparkicearena.com',
		scheduleUrl: 'https://www.hazelparkicearena.com/programs/stick-and-puck',
		source: {
			adapter: 'bond',
			programs: [
				{ programId: 13568, type: 'sticks_pucks' }, // "Stick & Puck" (all ages)
				{ programId: 5890, type: 'drop_in' } // "18 + Drop-In Hockey"
			]
		}
	},
	{
		id: 'troy-sports-center',
		name: 'Troy Sports Center (Buffalo Wild Wings Arena)',
		city: 'Troy',
		address: '1819 E Big Beaver Rd, Troy, MI 48083',
		lat: 42.56536,
		lng: -83.11181,
		website: 'https://www.troysports.com',
		scheduleUrl: 'https://troy.frontline-connect.com/scheduleselect.cfm?fac=troy&facid=1',
		source: {
			adapter: 'frontline',
			baseUrl: 'https://troy.frontline-connect.com',
			fac: 'troy',
			facid: 1,
			sessions: [
				{ id: 16, type: 'sticks_pucks', ageGroup: 'all', priceCents: 1500 }, // "STICKS N PUCKS"
				{ id: 12, type: 'sticks_pucks', ageGroup: 'all', priceCents: 1500 }, // "STICKS & PUCKS" (empty now)
				{ id: 3, type: 'drop_in', ageGroup: 'adult', priceCents: 1500 }, // "ADULT DROP-IN", 18+
				{ id: 7, type: 'drop_in', ageGroup: 'adult' } // "WOMEN'S DROP-IN" (empty now; price unverified)
			]
		}
	},
	{
		id: 'taylor-sportsplex',
		name: 'Taylor Sportsplex',
		city: 'Taylor',
		address: '13333 Pardee Rd, Taylor, MI 48180',
		lat: 42.20942,
		lng: -83.25418,
		website: 'https://www.taylorsportsplex.com',
		scheduleUrl: 'https://www.taylorsportsplex.com/1472/Stick-Puck',
		source: { adapter: 'daysmart', company: 'tsx', eventTypes: ['10'] }, // 10 = "Public Activities"
		// Drop-in is $10 mornings / $12 evenings, so it's left unset.
		prices: { sticks_pucks: 1000 }
	},
	{
		id: 'hartland-ice-house',
		name: 'Hartland Ice House',
		city: 'Hartland',
		address: '2755 Arena Dr, Hartland, MI 48353',
		lat: 42.63998,
		lng: -83.73045,
		website: 'https://www.hartlandicehouse.com',
		scheduleUrl: 'https://www.hartlandicehouse.com/sports/public-session/158971',
		source: { adapter: 'finnly', scheduleUrl: 'https://hih.finnlyconnect.com/schedule/875' }
	}
];
