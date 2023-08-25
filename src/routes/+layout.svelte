<script lang="ts">
    import '../app.css';
    import { pwaInfo } from 'virtual:pwa-info';
    import { onMount } from 'svelte';
    import { registerSW } from 'virtual:pwa-register';
    import { page } from '$app/stores';
    import { log } from '$lib/logger';

    $: log.pageView($page.route.id ?? '');

    async function initialize() {
        registerSW({}); // force a reload if the user is online and the app updated
        window.dispatchEvent(new Event('svelte-app-loaded')); // tell the app.html to show the page
    }

    onMount(initialize);

    // get the manifest info to include in the head
    $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
    <title>aquifer</title>
    {@html webManifestLink}
</svelte:head>

<slot />
