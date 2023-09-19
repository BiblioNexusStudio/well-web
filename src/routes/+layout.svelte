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
    import FeatureFlagModal from '$lib/components/FeatureFlagModal.svelte';

    $: log.pageView($page.route.id ?? '');

    async function initialize() {
        registerSW({}); // force a reload if the user is online and the app updated
        window.dispatchEvent(new Event('svelte-app-loaded')); // tell the app.html to show the page
    }

    onMount(() => {
        updateOnlineStatus();
        initialize();
    });

    // get the manifest info to include in the head
    $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
    <title>Bible Well</title>
    {@html webManifestLink}
</svelte:head>

<svelte:window on:online={updateOnlineStatus} on:offline={updateOnlineStatus} />

<FeatureFlagModal />

<slot />
