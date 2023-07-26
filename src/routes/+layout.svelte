<script>
    import '../app.css';
    import { pwaInfo } from 'virtual:pwa-info';
    import { onMount } from 'svelte';

    // register the service worker to enable offline mode
    onMount(async () => {
        if (pwaInfo) {
            const { registerSW } = await import('virtual:pwa-register');
            registerSW({
                immediate: true,
            });
        }
    });

    // get the manifest info to include in the head
    $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
    {@html webManifestLink}
</svelte:head>

<slot />
