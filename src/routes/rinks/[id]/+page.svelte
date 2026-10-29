<script lang="ts">
	import { page } from '$app/state';
	import SessionList from '#lib/components/SessionList.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { prettyDate } from '#lib/format.ts';
	import { iceRink, sessionEvents } from '#lib/structured-data.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const offers = $derived(
		[
			data.sessions.some((s) => s.type === 'sticks_pucks') && 'sticks & pucks',
			data.sessions.some((s) => s.type === 'drop_in') && 'drop-in hockey'
		].filter(Boolean)
	);
	const description = $derived(
		`Upcoming ${offers.length ? offers.join(' and ') : 'sticks & pucks and drop-in hockey'} at ${data.rink.name} in ${data.rink.city}, MI: session times, prices and booking links.`
	);
	const jsonLd = $derived([
		iceRink(data.rink, page.url.origin),
		...sessionEvents(data.sessions, data.rink, page.url.origin)
	]);
</script>

<Seo
	title="{data.rink.name} Sticks & Pucks and Drop-in Schedule · Ice Tendy"
	{description}
	path="/rinks/{data.rink.id}"
	{jsonLd}
/>

<nav class="crumbs" aria-label="Breadcrumb"><a href="/rinks">Rinks</a> / {data.rink.city}</nav>
<h1>{data.rink.name}</h1>
<p class="meta">
	{[data.rink.address, `${data.miles.toFixed(1)} mi from Ann Arbor`].filter(Boolean).join(' · ')}
</p>
<p class="links">
	{#if data.rink.schedule_url}<a href={data.rink.schedule_url} target="_blank" rel="noopener">Rink schedule ↗</a>{/if}
	{#if data.rink.website}<a href={data.rink.website} target="_blank" rel="noopener">Website ↗</a>{/if}
</p>

{#if data.rink.adapter === 'manual'}
	<p class="note">
		This rink only publishes its typical weekly times, so these sessions are a guide. Confirm with the rink before you
		go.
	</p>
{/if}

<h2 class="section">Next {data.upcomingDays} days</h2>
{#if data.days.length === 0}
	<p class="empty">
		No sticks & pucks or drop-in sessions are posted for the next {data.upcomingDays} days. Check the rink's own schedule
		for updates.
	</p>
{/if}

{#each data.days as day (day.date)}
	<section class="card">
		<h3>{prettyDate(day.date)}</h3>
		<SessionList sessions={day.sessions} fallbackUrl={data.rink.schedule_url} />
	</section>
{/each}

{#if data.rink.last_checked_at && data.rink.adapter !== 'manual'}
	<p class="checked">Schedule checked {new Date(data.rink.last_checked_at).toLocaleString()}</p>
{/if}

<style>
	.crumbs {
		font-size: 0.85rem;
		color: var(--muted);
	}
	.crumbs a,
	.links a {
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
	}
	h1 {
		margin: 0.25rem 0 0;
		font-size: 1.35rem;
	}
	.meta,
	.empty,
	.checked {
		color: var(--muted);
	}
	.meta {
		margin: 0.3rem 0 0;
	}
	.links {
		display: flex;
		gap: 1rem;
		margin: 0.5rem 0 0;
	}
	.note {
		margin: 1rem 0 0;
		padding: 0.6rem 0.8rem;
		border-radius: 8px;
		background: var(--di);
		font-size: 0.9rem;
	}
	.section {
		margin: 1.5rem 0 0.75rem;
		font-size: 1rem;
		color: var(--muted);
		font-weight: 600;
	}
	h3 {
		margin: 0;
		font-size: 1rem;
	}
	.checked {
		font-size: 0.75rem;
	}
</style>
