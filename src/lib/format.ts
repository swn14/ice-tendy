export function formatPrice(cents: number | null) {
	return cents == null ? null : `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
}

/** "2026-11-02" → "Monday, November 2" */
export function prettyDate(ymd: string) {
	const [y, m, d] = ymd.split('-').map(Number);
	return new Date(y, m - 1, d).toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});
}
