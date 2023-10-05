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
    import FeatureFlagModal from '$lib/components/FeatureFlagModal.svelte';
    import UpdateServiceWorkerModal from '$lib/components/UpdateServiceWorkerModal.svelte';

    $: log.pageView($page.route.id ?? '');

    let showingUpdateModal = false;
    let updateServiceWorker: (() => void) | null = null;

    async function initialize() {
        updateServiceWorker = registerSW({
            // this gets called if VitePWA detects that pre-cached app content has changed
            onNeedRefresh() {
                if (!import.meta.env.DEV) {
                    showingUpdateModal = true;
                }
            },
        });
        if (import.meta.env.DEV) {
            // to prevent annoyance in dev, always update immediately
            updateServiceWorker!();
        }
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

<FeatureFlagModal />
<UpdateServiceWorkerModal bind:show={showingUpdateModal} onUpdate={updateServiceWorker} />

<slot />
