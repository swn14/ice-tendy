<script lang="ts">
	import { page } from '$app/state';
	import SessionList from '#lib/components/SessionList.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { prettyDate } from '#lib/format.ts';
	import { sessionEvents, website } from '#lib/structured-data.ts';
	import { SESSION_TYPE_LABELS } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const typeOptions = [
		{ value: '', label: 'Both' },
		{ value: 'sticks_pucks', label: SESSION_TYPE_LABELS.sticks_pucks },
		{ value: 'drop_in', label: SESSION_TYPE_LABELS.drop_in }
	];

	const jsonLd = $derived([
		website(page.url.origin),
		...data.rinks.flatMap((g) => sessionEvents(g.sessions, g.rink, page.url.origin))
	]);
</script>

<Seo
	title="Ice Tendy · Sticks & Pucks and Drop-in Hockey Near Ann Arbor & Detroit"
	description="Find sticks & pucks and drop-in hockey at {data.rinkCount} ice rinks around Ann Arbor and metro Detroit. Pick a day and see every open-ice session with times, prices and booking links."
	path="/"
	{jsonLd}
/>

<h1>Sticks & pucks and drop-in hockey near Ann Arbor & Detroit</h1>
<p class="intro">
	Pick a day to see open-ice sessions at <a href="/rinks">{data.rinkCount} rinks</a>, nearest to Ann Arbor first.
</p>

<form method="GET" onchange={(e) => e.currentTarget.requestSubmit()}>
	<label>
		<span>Date</span>
		<input type="date" name="date" value={data.date} />
	</label>
	<fieldset>
		<legend>Type</legend>
		{#each typeOptions as opt (opt.value)}
			<label class="chip">
				<input type="radio" name="type" value={opt.value} checked={(data.type ?? '') === opt.value} />
				{opt.label}
			</label>
		{/each}
	</fieldset>
	<noscript><button>Search</button></noscript>
</form>

<p class="summary">
	{data.total}
	{data.total === 1 ? 'session' : 'sessions'} on {prettyDate(data.date)}
</p>

{#if data.rinks.length === 0}
	<p class="empty">Nothing found for this day. Try another date or type.</p>
{/if}

{#each data.rinks as group (group.rink.id)}
	<section class="card">
		<div class="rink-head">
			<h2><a href="/rinks/{group.rink.id}">{group.rink.name}</a></h2>
			<span class="meta">{group.rink.city} · {group.miles.toFixed(1)} mi</span>
		</div>
		<SessionList sessions={group.sessions} fallbackUrl={group.rink.schedule_url} />
		{#if group.rink.adapter === 'manual'}
			<p class="checked">Typical weekly times from the rink's website. Confirm with the rink before you go.</p>
		{:else if group.rink.last_checked_at}
			<p class="checked">Schedule checked {new Date(group.rink.last_checked_at).toLocaleString()}</p>
		{/if}
	</section>
{/each}

<style>
	.meta,
	.checked,
	.summary,
	.empty {
		color: var(--muted);
	}
	form {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: end;
	}
	form label > span,
	legend {
		display: block;
		font-size: 0.8rem;
		color: var(--muted);
		margin-bottom: 0.25rem;
	}
	input[type='date'] {
		font: inherit;
		padding: 0.4rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--card);
		color: var(--text);
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	legend {
		width: 100%;
	}
	.chip {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.35rem 0.8rem;
		background: var(--card);
		cursor: pointer;
	}
	.chip:has(input:checked) {
		border-color: var(--accent);
		color: var(--accent);
		font-weight: 600;
	}
	.chip input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.chip:has(input:focus-visible) {
		outline: 2px solid var(--accent);
	}
	.summary {
		margin: 1.5rem 0 0.75rem;
	}
	.rink-head {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: baseline;
	}
	h1 {
		margin: 0;
		font-size: 1.35rem;
		line-height: 1.25;
	}
	.intro {
		margin: 0.4rem 0 1.25rem;
		color: var(--muted);
	}
	.intro a {
		color: var(--accent);
		font-weight: 600;
	}
	h2 {
		margin: 0;
		font-size: 1.1rem;
	}
	h2 a {
		color: inherit;
		text-decoration: none;
	}
	h2 a:hover {
		text-decoration: underline;
	}
	.checked {
		font-size: 0.75rem;
		margin: 0.5rem 0 0;
	}
</style>
