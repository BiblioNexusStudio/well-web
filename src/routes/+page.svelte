<script>
    import { useRegisterSW } from 'virtual:pwa-register/svelte';

    const { offlineReady } = useRegisterSW({
        immediate: true
    });
</script>

{#if offlineReady}
    is offline ready
{:else}
    not offline ready
{/if}
<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
