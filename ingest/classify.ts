import type { AgeGroup, SessionType } from '../src/lib/types.ts';

const TYPE_PATTERNS: [RegExp, SessionType][] = [
	[/\bsticks?\s*(?:&|and|n'?|-n-|-)?\s*pucks?\b|\bstick\s*time\b/i, 'sticks_pucks'],
	[/\bdrop[- ]?in\b|\bpick[- ]?up\b|\bopen hockey\b|\bshinny\b/i, 'drop_in']
];

// Same words, wrong surface.
const NOT_ICE = /\broller\b|\binline\b|\bball hockey\b|\bfloor hockey\b|\bdek\b/i;

/** Guess a session type from a free-text event name. Callers should only pass public-session names. */
export function classify(text: string): SessionType | null {
	if (NOT_ICE.test(text)) return null;
	return TYPE_PATTERNS.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

/** Guess an age group from free text ("18+ Drop In", "Youth Sticks & Pucks"). */
export function ageGroupFrom(text: string): AgeGroup | null {
	if (/\ball ages\b/i.test(text)) return 'all';
	if (/\byouth\b|\bkids?\b|\bjunior\b|\b\d{1,2}\s*u\b|\bunder\s*\d+/i.test(text)) return 'youth';
	if (/\badults?\b|\b(1[6-9]|[2-9]\d)\s*\+|\bseniors?\b|\bover\s*\d{2}\b/i.test(text)) return 'adult';
	return null;
}
