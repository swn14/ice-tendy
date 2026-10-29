<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function summary(counts: { sticks_pucks: number; drop_in: number }) {
		const parts = [
			counts.sticks_pucks && `${counts.sticks_pucks} sticks & pucks`,
			counts.drop_in && `${counts.drop_in} drop-in`
		].filter(Boolean);
		return parts.length ? `${parts.join(' · ')} in the next ${data.days} days` : 'No sessions posted right now';
	}
</script>

<Seo
	title="Ice Rinks With Sticks & Pucks and Drop-in Hockey Near Ann Arbor & Detroit · Ice Tendy"
	description="Every ice rink Ice Tendy tracks around Ann Arbor and metro Detroit, with upcoming sticks & pucks and drop-in hockey sessions at each."
	path="/rinks"
/>

<h1>Rinks</h1>
<p class="intro">
	{data.rinks.length} ice rinks around Ann Arbor and metro Detroit, nearest first. Open a rink for its upcoming sticks
	& pucks and drop-in schedule.
</p>

<ul>
	{#each data.rinks as { rink, miles, counts } (rink.id)}
		<li class="card">
			<a href="/rinks/{rink.id}">
				<span class="name">{rink.name}</span>
				<span class="meta">{rink.city} · {miles.toFixed(1)} mi</span>
				<span class="counts">{summary(counts)}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	h1 {
		margin: 0;
		font-size: 1.35rem;
	}
	.intro {
		margin: 0.4rem 0 1.25rem;
		color: var(--muted);
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li.card {
		padding: 0;
	}
	a {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.2rem 0.75rem;
		padding: 0.85rem 1rem;
		color: inherit;
		text-decoration: none;
	}
	a:hover .name {
		color: var(--accent);
		text-decoration: underline;
	}
	.name {
		font-weight: 700;
	}
	.meta,
	.counts {
		color: var(--muted);
		font-size: 0.9rem;
	}
	.counts {
		grid-column: 1 / -1;
	}
</style>
