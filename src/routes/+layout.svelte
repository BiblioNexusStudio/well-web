<script lang="ts">
    import '../app.css';
    // eslint-disable-next-line
    // @ts-ignore
    import { pwaInfo } from 'virtual:pwa-info';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { log } from '$lib/logger';
    import { updateOnlineStatus } from '$lib/stores/is-online.store';
    import { featureFlags } from '$lib/stores/feature-flags.store';
    import DebugModal from '$lib/components/DebugModal.svelte';
    import { fetchFromCacheOrApi } from '$lib/data-cache';

    $: log.pageView($page.route.id ?? '');

    async function initialize() {
        window.dispatchEvent(new Event('svelte-app-loaded')); // tell the app.html to show the page
    }

    async function precacheNecessaryCalls() {
        await Promise.all([fetchFromCacheOrApi('/resources/types'), fetchFromCacheOrApi('/bibles')]);
    }

    onMount(() => {
        updateOnlineStatus();
        initialize();
        precacheNecessaryCalls();
    });

    onMount(() => {
        let unsubscribe = featureFlags.subscribe((flags) => {
            if (flags.darkMode) {
                document.documentElement.setAttribute('data-theme', 'biblioNexusDark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        });

        return unsubscribe;
    });

    function onError(event: Event) {
        if ('error' in event) {
            const error = event.error as Error;
            log.exception(error);
        }
    }

    function onRejection(event: PromiseRejectionEvent) {
        const error = event.reason as Error;
        event.preventDefault();
        log.exception(error);
    }

    // get the manifest info to include in the head
    $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
    <title>Bible Well</title>
    {@html webManifestLink}
</svelte:head>

<svelte:window
    on:online={updateOnlineStatus}
    on:offline={updateOnlineStatus}
    on:error={onError}
    on:unhandledrejection={onRejection}
/>

<DebugModal />

<slot />
