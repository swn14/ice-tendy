<script lang="ts">
	import { formatPrice } from '#lib/format.ts';
	import { formatTime } from '#lib/time.ts';
	import { SESSION_TYPE_LABELS, type Session } from '#lib/types.ts';

	interface Props {
		sessions: Session[];
		/** Rink schedule page, used when a session has no booking link of its own. */
		fallbackUrl: string | null;
	}

	let { sessions, fallbackUrl }: Props = $props();
</script>

<ul>
	{#each sessions as s (s.id)}
		{@const href = s.booking_url ?? fallbackUrl}
		<li>
			<span class="time">
				{formatTime(s.starts_at)}{#if s.ends_at}–{formatTime(s.ends_at)}{/if}
			</span>
			<span class="what">
				<span class="tag {s.type}">{SESSION_TYPE_LABELS[s.type]}</span>
				{#if s.age_group && s.age_group !== 'all'}<span class="tag age">{s.age_group}</span>{/if}
				{#if s.title}<span class="title">{s.title}</span>{/if}
			</span>
			<span class="book">
				{#if formatPrice(s.price_cents)}<span class="price">{formatPrice(s.price_cents)}</span>{/if}
				{#if href}<a {href} target="_blank" rel="noopener">Book ↗</a>{/if}
			</span>
		</li>
	{/each}
</ul>

<style>
	ul {
		list-style: none;
		padding: 0;
		margin: 0.6rem 0 0;
	}
	li {
		display: grid;
		grid-template-columns: 11rem 1fr auto;
		grid-template-areas: 'time what book';
		align-items: center;
		gap: 0.3rem 0.75rem;
		padding: 0.5rem 0;
		border-top: 1px solid var(--border);
	}
	@media (max-width: 34rem) {
		li {
			grid-template-columns: 1fr auto;
			grid-template-areas: 'time book' 'what what';
		}
	}
	.time {
		grid-area: time;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
	.what {
		grid-area: what;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
	}
	.book {
		grid-area: book;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		white-space: nowrap;
	}
	.tag {
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		text-transform: capitalize;
	}
	.tag.sticks_pucks {
		background: var(--sp);
	}
	.tag.drop_in {
		background: var(--di);
	}
	.tag.age {
		border: 1px solid var(--border);
	}
	.title {
		color: var(--muted);
		font-size: 0.9rem;
	}
	a {
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
	}
</style>
