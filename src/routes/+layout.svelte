<script lang="ts">
    import '../app.css';
    import { pwaInfo } from 'virtual:pwa-info';
    import { onMount } from 'svelte';
    import { registerSW } from 'virtual:pwa-register';
    let loadedConfig = false;

    async function initialize() {
        registerSW({}); // force a reload if the user is online and the app updated
        initializeConfig();
    }

    async function initializeConfig() {
        const [globalConfig, envConfig] = await Promise.all([
            fetch('/global-config.json').then((r) => r.json()),
            fetch('/env-config.json').then((r) => r.json()),
        ]);
        window.__CONFIG = Object.assign({}, globalConfig, envConfig);
        loadedConfig = true;
    }

    onMount(initialize);

    // get the manifest info to include in the head
    $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
    {@html webManifestLink}
</svelte:head>

{#if loadedConfig}
    <slot />
{/if}
