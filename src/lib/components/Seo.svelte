<script lang="ts">
	import { page } from '$app/state';
	import { SITE } from '#lib/site.ts';

	interface Props {
		title: string;
		description: string;
		/** Canonical path, without query string. */
		path: string;
		/** schema.org objects, emitted as JSON-LD. */
		jsonLd?: object[];
	}

	let { title, description, path, jsonLd = [] }: Props = $props();

	const url = $derived(new URL(path, page.url.origin).href);
	const image = $derived(new URL('/og.png', page.url.origin).href);
	// Escape "<" so data can't close the script element early.
	const scripts = $derived(
		jsonLd.map((data) => '<script type="application/ld+json">' + JSON.stringify(data).replace(/</g, '\\u003c') + '</' + 'script>')
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="{SITE.name}: {SITE.tagline}" />
	<meta name="twitter:card" content="summary_large_image" />
	{#each scripts as script, i (i)}
		{@html script}
	{/each}
</svelte:head>
