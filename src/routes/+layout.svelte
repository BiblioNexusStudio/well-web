<script lang="ts">
    import '../app.css';
    // eslint-disable-next-line
    // @ts-ignore
    import { pwaInfo } from 'virtual:pwa-info';
    import { onMount } from 'svelte';
    // eslint-disable-next-line
    // @ts-ignore
    import { registerSW } from 'virtual:pwa-register';
    import { page } from '$app/stores';
    import { log } from '$lib/logger';
    import { updateOnlineStatus } from '$lib/stores/is-online.store';
    import { featureFlags } from '$lib/stores/feature-flags.store';
    import DebugModal from '$lib/components/DebugModal.svelte';

    $: log.pageView($page.route.id ?? '');

    async function initialize() {
        const initializedAt = Date.now();
        const updateServiceWorker = registerSW({
            onNeedRefresh() {
                // if we receive the "SW update" event within 750ms of the time the app was initialized,
                // we know that the page must have just been refreshed, and we can go ahead and do the
                // service worker update without fear of disturbing the user
                if (Date.now() - initializedAt < 750) {
                    updateServiceWorker();
                }
            },
        });

        window.dispatchEvent(new Event('svelte-app-loaded')); // tell the app.html to show the page
    }

    onMount(() => {
        updateOnlineStatus();
        initialize();
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

    // get the manifest info to include in the head
    $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
    <title>Bible Well</title>
    {@html webManifestLink}
</svelte:head>

<svelte:window on:online={updateOnlineStatus} on:offline={updateOnlineStatus} />

<DebugModal />

<slot />
