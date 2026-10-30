<script lang="ts">
	import { browser, dev } from '$app/env';
	import { afterNavigate } from '$app/navigation';
	import { SITE } from '#lib/site.ts';

	const id = SITE.gaMeasurementId;
	const enabled = browser && !dev && id !== '';

	if (enabled) {
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () {
			// gtag.js expects the arguments object itself, not an array.
			window.dataLayer.push(arguments);
		};
		window.gtag('js', new Date());
		// Page views are sent below instead: SvelteKit updates the URL before it renders the new page,
		// so GA's automatic history tracking would record each page under the previous page's title.
		window.gtag('config', id, { send_page_view: false });

		const script = document.createElement('script');
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
		document.head.appendChild(script);
	}

	// Runs on the first load and after every client-side navigation, including schedule filter changes.
	afterNavigate(() => {
		if (!enabled) return;
		window.gtag('event', 'page_view', { page_location: location.href, page_title: document.title });
	});
</script>
