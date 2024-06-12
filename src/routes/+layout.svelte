<script lang="ts">
    import '../app.css';
    // eslint-disable-next-line
    // @ts-ignore
    import { pwaInfo } from 'virtual:pwa-info';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { log } from '$lib/logger';
    import { isOnline, updateOnlineStatus } from '$lib/stores/is-online.store';
    import { featureFlags } from '$lib/stores/feature-flags.store';
    import DebugModal from '$lib/components/DebugModal.svelte';
    import { clearEntireCache, fetchFromCacheOrApi } from '$lib/data-cache';
    import type { LayoutData } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import { currentLanguageDirection, currentLanguageInfo } from '$lib/stores/language.store';
    import { goto } from '$app/navigation';
    import type { Language } from '$lib/types/file-manager';
    import { parentResources } from '$lib/stores/parent-resource.store';
    import { parentResourcesEndpoint } from '$lib/api-endpoints';
    import { get } from 'svelte/store';

    $: {
        document.dir = $currentLanguageDirection;
    }

    $: log.pageView($page.route.id ?? '');
    $: setParentResources($currentLanguageInfo);

    export let data: LayoutData;

    async function initialize() {
        window.dispatchEvent(new Event('svelte-app-loaded')); // tell the app.html to show the page
    }

    async function setParentResources(language: Language | undefined) {
        const currentLanguageParentResources = await fetchFromCacheOrApi(...parentResourcesEndpoint(language?.id));
        if (get(currentLanguageInfo)?.id === language?.id) {
            parentResources.set(currentLanguageParentResources);
        }
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

    onMount(() => {
        if (localStorage.getItem('bible-well-language-code-set') !== 'true') {
            goto('/select-language');
        }
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

    function onInteraction(e: MouseEvent) {
        let element = e.target as HTMLElement;
        for (let i = 0; i < 5; i++) {
            if (element?.dataset?.appInsightsEventName) {
                log.trackEvent(element.dataset.appInsightsEventName.replace(/\s/g, ''));
                break;
            }
            element = element?.parentNode as HTMLElement;
        }
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
    on:click={onInteraction}
/>

<DebugModal />

{#if !data.browserSupported}
    <div class="mx-auto flex h-full w-full max-w-lg flex-col items-center space-y-4 px-4 text-lg">
        <div class="flex-grow"></div>
        <div class="text-center">{$translate('errorMessage.browserUnsupported.value')}</div>
        <div class="flex-grow"></div>
    </div>
{:else if data.error}
    <div class="mx-auto flex h-full w-full max-w-lg flex-col items-center space-y-4 px-4 text-lg">
        <div class="flex-grow"></div>
        <!-- can't be translated since the translation strings failed to load -->
        <div class="text-center">An error occurred. Please try refreshing your browser.</div>
        {#if $isOnline}
            <div class="text-center">
                If this error persists, please clear your cache by clicking the button below. <b
                    >Warning! Clearing the cache will delete all downloaded content.</b
                >
            </div>
            <button class="btn" on:click={clearEntireCache}>Clear Cache</button>
        {/if}
        <div class="flex-grow"></div>
    </div>
{:else}
    <slot />
{/if}
