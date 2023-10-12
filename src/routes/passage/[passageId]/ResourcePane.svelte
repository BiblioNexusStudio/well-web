<script lang="ts">
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { cachedOrRealUrl } from '$lib/data-cache';
    import { _ as translate } from 'svelte-i18n';
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { PassageResourceContent } from '$lib/types/passage';
    import { ResourceType } from '$lib/types/resource';
    import { asyncMap } from '$lib/utils/async-array';
    import {
        fetchDisplayNameForResourceContent,
        fetchTiptapForResourceContent,
        resourceContentApiFullUrl,
    } from '$lib/utils/data-handlers/resources/resource';
    import type { ImageResource, TextResource } from './types';
    import FullscreenMediaResource from './FullscreenMediaResource.svelte';
    import FullscreenTextResource from './FullscreenTextResource.svelte';
    import { parseTiptapJsonToHtml, parseTiptapJsonToText } from '$lib/utils/tiptap-parsers';
    import { Icon } from 'svelte-awesome';
    import arrowRight from 'svelte-awesome/icons/arrowRight';

    export let resourcePane: CupertinoPane;
    export let isShowing: boolean;
    export let resources: PassageResourceContent[] | undefined;
    export let activeTab: 'basic' | 'advanced' = 'basic';

    $: showBasicTab = imageResources.length > 0;
    $: showAdvancedTab = tyndaleBibleDictionaryResources.length > 0;
    $: activeTab = showBasicTab ? 'basic' : 'advanced';

    let imageResources: ImageResource[] = [];
    let tyndaleBibleDictionaryResources: TextResource[] = [];

    $: prepareUbsImageResources(resources || []);
    $: prepareTextResources(resources || []);

    let mediaResources: ImageResource[] = [];
    $: mediaResources = imageResources;

    let currentFullscreenMediaResourceIndex: number | null = null;
    let currentFullscreenTextResource: TextResource | null = null;

    onMount(() => {
        resourcePane = new CupertinoPane('#resource-pane', {
            parentElement: '#passage-page',
            buttonDestroy: false,
            bottomClose: true,
            fastSwipeClose: true,
            initialBreak: 'top',
            breaks: {
                top: {
                    enabled: true,
                    height: window.innerHeight - 50,
                },
                middle: { enabled: false },
                bottom: { enabled: false, height: window.screen.height - 300 },
            },
            lowerThanBottom: true,
            backdrop: true,
            backdropOpacity: 0.4,
            simulateTouch: false,
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });
    });

    function handleImageSelected(image: ImageResource) {
        currentFullscreenMediaResourceIndex = mediaResources.indexOf(image);
    }

    function handleTextResourceSelected(textResource: TextResource) {
        currentFullscreenTextResource = textResource;
    }

    async function prepareUbsImageResources(resources: PassageResourceContent[]) {
        imageResources = await asyncMap(
            resources.filter(({ typeName }) => typeName === ResourceType.UbsImages),
            async (resource) => ({
                isImage: true,
                displayName: await fetchDisplayNameForResourceContent(resource),
                url: resourceContentApiFullUrl(resource),
            })
        );
    }

    async function prepareTextResources(resources: PassageResourceContent[]) {
        const filteredResources = resources.filter(({ typeName }) => typeName === ResourceType.TyndaleBibleDictionary);
        const mappedResources = await asyncMap(filteredResources, async (resource) => {
            const [displayName, tiptap] = await Promise.all([
                fetchDisplayNameForResourceContent(resource),
                fetchTiptapForResourceContent(resource),
            ]);
            if (tiptap) {
                return {
                    displayName,
                    html: parseTiptapJsonToHtml(tiptap.tiptap, { excludeHeader1: true }),
                    preview: parseTiptapJsonToText(tiptap.tiptap, { excludeHeader1: true }).slice(0, 100),
                };
            } else {
                return null;
            }
        });
        tyndaleBibleDictionaryResources = mappedResources
            .filter(Boolean)
            .sort((a, b) =>
                a?.displayName && b?.displayName ? a.displayName.localeCompare(b.displayName) : 0
            ) as TextResource[];
    }
</script>

<svelte:window
    on:keydown={(key) => {
        if (key.key === 'Escape') {
            if (currentFullscreenMediaResourceIndex !== null) {
                currentFullscreenMediaResourceIndex = null;
            } else if (currentFullscreenTextResource !== null) {
                currentFullscreenTextResource = null;
            } else if (isShowing) {
                isShowing = false;
            }
        }
    }}
/>

<FullscreenMediaResource bind:currentIndex={currentFullscreenMediaResourceIndex} resources={mediaResources} />
<FullscreenTextResource bind:resource={currentFullscreenTextResource} />

<div id="resource-pane" use:trapFocus={isShowing} class="flex-grow px-4 pb-4 mb-16">
    <div class="text-lg font-semibold text-base-content pb-8">
        {$translate('page.passage.resourcePane.title.value')}
    </div>
    <div class="tabs !border-b-0 w-full mb-6">
        {#if showBasicTab}
            <button
                class="tab text-sm font-semibold tab-bordered {activeTab === 'basic'
                    ? 'tab-active text-secondary-content !border-secondary-content !border-b-2'
                    : 'text-gray-500 !border-b border-b-gray-200'}"
                on:click={() => (activeTab = 'basic')}>{$translate('page.passage.resourcePane.basicTab.value')}</button
            >
        {/if}
        {#if showAdvancedTab}
            <button
                class="tab text-sm font-semibold tab-bordered {activeTab === 'advanced'
                    ? 'tab-active text-secondary-content !border-secondary-content !border-b-2'
                    : 'text-gray-500 !border-b border-b-gray-200'}"
                on:click={() => (activeTab = 'advanced')}
                >{$translate('page.passage.resourcePane.advancedTab.value')}</button
            >
        {/if}
        <div class="flex-grow border-b border-b-gray-200" />
    </div>
    <div class={activeTab !== 'basic' ? 'hidden' : ''}>
        {#if imageResources.length}
            <div class="text-md font-semibold text-base-content pb-2">
                {$translate('page.passage.resourcePane.types.ubsImages.value')}
            </div>
            <div class="carousel space-x-2">
                {#each imageResources as image}
                    <button class="carousel-item flex-col" on:click={() => handleImageSelected(image)}>
                        <img
                            class="h-20 w-32 object-cover rounded-lg border border-gray-300 mb-1"
                            src={cachedOrRealUrl(image.url)}
                            alt={image.displayName}
                        />
                        <span class="text-sm text-neutral">{image.displayName}</span>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
    <div class={activeTab !== 'advanced' ? 'hidden' : ''}>
        {#if tyndaleBibleDictionaryResources.length}
            <div class="text-md font-semibold text-base-content pb-2">
                {$translate('page.passage.resourcePane.types.tyndaleBibleDictionary.value')}
            </div>
            {#each tyndaleBibleDictionaryResources as entry}
                <button
                    class="py-3 flex flex-row items-center w-full"
                    on:click={() => handleTextResourceSelected(entry)}
                >
                    <div class="flex flex-col flex-shrink items-start">
                        <div class="text-sm text-start font-medium text-base-content">{entry.displayName}</div>
                        <div class="text-sm text-neutral text-start line-clamp-1 break-all">{entry.preview}</div>
                    </div>
                    <div class="flex-shrink-0 pl-9 pr-3">
                        <Icon class="text-neutral" data={arrowRight} />
                    </div>
                </button>
            {/each}
        {/if}
    </div>
</div>

<style lang="postcss">
    :global(.cupertino-pane-wrapper .backdrop) {
        z-index: 30;
    }
    :global(.cupertino-pane-wrapper .pane) {
        @apply bg-primary-content;
        z-index: 40;
        cursor: initial !important;
    }
</style>
