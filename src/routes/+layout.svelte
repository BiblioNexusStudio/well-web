<script lang="ts">
    import '../app.css';
    import { pwaInfo } from 'virtual:pwa-info';
    import { onMount } from 'svelte';
    import { registerSW } from 'virtual:pwa-register';

    async function initialize() {
        registerSW({}); // force a reload if the user is online and the app updated
    }

    onMount(initialize);

    // get the manifest info to include in the head
    $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
    {@html webManifestLink}
</svelte:head>

<slot />
