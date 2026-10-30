<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import Analytics from '#lib/components/Analytics.svelte';
	import { SITE } from '#lib/site.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

<Analytics />

<div class="shell">
	<header>
		<a class="brand" href="/" aria-label="{SITE.name} home">
			<img src={favicon} alt="" width="44" height="44" />
			<span class="wordmark">{SITE.name}</span>
		</a>
		<nav aria-label="Main">
			<a href="/">Schedule</a>
			<a href="/rinks">Rinks</a>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<p class="signature">— Built & maintained by <a href={SITE.authorLink} target="_blank">{SITE.author}</a></p>
		<p class="fine">
			Schedules are collected from each rink's own website and can change without notice. Confirm with the
			rink before you go.
		</p>
	</footer>
</div>

<style>
	:global(:root) {
		--bg: #f4f7fb;
		--card: #ffffff;
		--text: #14202e;
		--muted: #5d6b7c;
		--border: #dde3ea;
		--accent: #1f5fbf;
		--brand: #0f2f57;
		--brand-red: #e23b3b;
		--sp: #d9ecff;
		--di: #ffe6cc;
		--link: #0000ee;
		--link-visited: #551a8b;
		color-scheme: light dark;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root) {
			--bg: #0d131a;
			--card: #161f2a;
			--text: #e6edf5;
			--muted: #93a1b2;
			--border: #263241;
			--accent: #7fb0ff;
			--brand: #cfe3fa;
			--sp: #1d3a5c;
			--di: #5a3a17;
			/* Classic blue/purple are unreadable on dark backgrounds; these are the lightened equivalents. */
			--link: #9e9eff;
			--link-visited: #d0adf0;
		}
	}
	:global(body) {
		margin: 0;
		background: var(--bg);
		color: var(--text);
		font-family: system-ui, sans-serif;
	}
	.shell {
		max-width: 44rem;
		min-height: 100vh;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		flex-direction: column;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 1.5rem 0 1.25rem;
	}
	nav {
		display: flex;
		gap: 1.1rem;
	}
	nav a {
		color: var(--muted);
		font-weight: 600;
		text-decoration: none;
	}
	nav a:hover {
		color: var(--accent);
	}
	:global(.card) {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.9rem 1rem;
		margin-bottom: 0.9rem;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		color: var(--brand);
		text-decoration: none;
	}
	.brand img {
		border-radius: 10px;
	}
	.wordmark {
		font-family: 'Barlow Condensed', system-ui, sans-serif;
		font-weight: 700;
		font-style: italic;
		font-size: 2.2rem;
		letter-spacing: 0.01em;
		line-height: 1;
		text-transform: uppercase;
	}
	main {
		flex: 1;
		padding-bottom: 3rem;
	}
	footer {
		border-top: 1px solid var(--border);
		padding: 1.5rem 0 2.5rem;
		text-align: center;
	}
	.signature {
		margin: 0;
		font-family: 'Caveat', cursive;
		font-size: 1.9rem;
		color: var(--brand);
	}
	.signature a {
		color: var(--link);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
	.signature a:visited {
		color: var(--link-visited);
	}
	.fine {
		margin: 0.5rem auto 0;
		max-width: 30rem;
		font-size: 0.8rem;
		color: var(--muted);
	}
</style>
