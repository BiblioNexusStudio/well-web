<script lang="ts">
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { PassageResourceContent } from '$lib/types/passage';
    import { ResourceType, type ResourceTypeEnum } from '$lib/types/resource';
    import { asyncMap } from '$lib/utils/async-array';
    import {
        fetchDisplayNameForResourceContent,
        fetchTiptapForResourceContent,
        resourceContentApiFullUrl,
    } from '$lib/utils/data-handlers/resources/resource';
    import type { ImageOrVideoResource, TextResource } from './types';
    import FullscreenMediaResource from './FullscreenMediaResource.svelte';
    import FullscreenTextResource from './FullscreenTextResource.svelte';
    import { parseTiptapJsonToHtml, parseTiptapJsonToText } from '$lib/utils/tiptap-parsers';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import TextResourceSection from './TextResourceSection.svelte';
    import VideoResourceSection from './VideoResourceSection.svelte';
    import ImageResourceSection from './ImageResourceSection.svelte';
    import { filterItemsByKeyMatchingSearchQuery, shouldSearch } from '$lib/utils/search';
    import FullscreenTextResourceSection from './FullscreenTextResourceSection.svelte';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import NoResourcesFound from './NoResourcesFound.svelte';

    export let resourcePane: CupertinoPane;
    export let isShowing: boolean;
    export let resources: PassageResourceContent[] | undefined;
    export let activeTab: 'basic' | 'advanced' | 'searching' = 'basic';
    export let isLoading = true;

    let searchQuery: string = '';

    $: showBasicTab = ubsImageResources.length > 0;
    $: showAdvancedTab = tyndaleBibleDictionaryResources.length > 0;
    $: activeTab = shouldSearch(searchQuery) ? 'searching' : showBasicTab ? 'basic' : 'advanced';

    // text resources
    let tyndaleBibleDictionaryResources: TextResource[] = [];
    let textResourcesByType = {} as Record<ResourceTypeEnum, TextResource[]>;
    $: textResources = tyndaleBibleDictionaryResources;

    // image and video resources
    let ubsImageResources: ImageOrVideoResource[] = [];
    let videoBibleDictionaryResources: ImageOrVideoResource[] = [];
    let mediaResources: ImageOrVideoResource[] = [];
    $: mediaResources = ubsImageResources.concat(videoBibleDictionaryResources);

    $: prepareResources(resources || []);

    $: filteredResourceCount =
        filterItemsByKeyMatchingSearchQuery(mediaResources, 'displayName', searchQuery).length +
        filterItemsByKeyMatchingSearchQuery(textResources, 'displayName', searchQuery).length;

    let currentFullscreenMediaResourceIndex: number | null = null;
    let currentFullscreenTextResource: TextResource | null = null;
    let currentFullscreenTextResourceSectionType: ResourceTypeEnum | null;

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

    function handleMediaResourceSelected(resource: ImageOrVideoResource) {
        currentFullscreenMediaResourceIndex = mediaResources.indexOf(resource);
    }

    function handleTextResourceSelected(textResource: TextResource) {
        currentFullscreenTextResource = textResource;
    }

    async function prepareResources(resources: PassageResourceContent[]) {
        isLoading = true;
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
        ubsImageResources = await asyncMap(
            resources.filter(({ typeName }) => typeName === ResourceType.UbsImages),
            async (resource) => ({
                type: 'image',
                displayName: await fetchDisplayNameForResourceContent(resource),
                url: resourceContentApiFullUrl(resource),
            })
        );
        videoBibleDictionaryResources = await asyncMap(
            resources.filter(({ typeName }) => typeName === ResourceType.VideoBibleDictionary),
            async (resource) => ({
                type: 'video',
                displayName: await fetchDisplayNameForResourceContent(resource),
                url: resourceContentApiFullUrl(resource),
            })
        );
        textResourcesByType.TyndaleBibleDictionary = tyndaleBibleDictionaryResources;
        isLoading = false;
    }
</script>

<svelte:window
    on:keydown={(key) => {
        if (key.key === 'Escape') {
            if (currentFullscreenMediaResourceIndex !== null) {
                currentFullscreenMediaResourceIndex = null;
            } else if (currentFullscreenTextResource !== null) {
                currentFullscreenTextResource = null;
            } else if (currentFullscreenTextResourceSectionType !== null) {
                currentFullscreenTextResourceSectionType = null;
            } else if (isShowing) {
                isShowing = false;
            }
        }
    }}
/>

<FullscreenMediaResource bind:currentIndex={currentFullscreenMediaResourceIndex} resources={mediaResources} />
<FullscreenTextResource bind:resource={currentFullscreenTextResource} />
<FullscreenTextResourceSection
    type={currentFullscreenTextResourceSectionType}
    {textResourcesByType}
    resourceSelected={handleTextResourceSelected}
    showTypeFullscreen={(type) => (currentFullscreenTextResourceSectionType = type)}
/>

<div id="resource-pane" use:trapFocus={isShowing}>
    <div class="flex h-full flex-col px-4 pb-16">
        <div class="pb-4 text-lg font-semibold text-base-content">
            {$translate('page.passage.resourcePane.title.value')}
        </div>
        {#if isLoading}
            <FullPageSpinner />
        {:else}
            <div class="mb-8">
                <SearchInput bind:searchQuery />
            </div>
            {#if activeTab === 'basic' || activeTab === 'advanced'}
                <div class="tabs mb-6 w-full !border-b-0">
                    {#if showBasicTab}
                        <button
                            class="tab tab-bordered text-sm font-semibold {activeTab === 'basic'
                                ? 'tab-active !border-b-2 !border-secondary-content text-secondary-content'
                                : '!border-b border-b-gray-200 text-gray-500'}"
                            on:click={() => (activeTab = 'basic')}
                            >{$translate('page.passage.resourcePane.basicTab.value')}</button
                        >
                    {/if}
                    {#if showAdvancedTab}
                        <button
                            class="tab tab-bordered text-sm font-semibold {activeTab === 'advanced'
                                ? 'tab-active !border-b-2 !border-secondary-content text-secondary-content'
                                : '!border-b border-b-gray-200 text-gray-500'}"
                            on:click={() => (activeTab = 'advanced')}
                            >{$translate('page.passage.resourcePane.advancedTab.value')}</button
                        >
                    {/if}
                    <div class="flex-grow border-b border-b-gray-200" />
                </div>
            {/if}
            <div class={activeTab === 'basic' || activeTab === 'searching' ? 'visible' : 'hidden'}>
                <ImageResourceSection
                    title={$translate('page.passage.resourcePane.types.ubsImages.value')}
                    resources={ubsImageResources}
                    resourceSelected={handleMediaResourceSelected}
                    {searchQuery}
                />
                <VideoResourceSection
                    title={$translate('page.passage.resourcePane.types.videoBibleDictionary.value')}
                    resources={videoBibleDictionaryResources}
                    resourceSelected={handleMediaResourceSelected}
                    {searchQuery}
                />
            </div>
            <div class={activeTab === 'advanced' || activeTab === 'searching' ? 'visible' : 'hidden'}>
                <TextResourceSection
                    type={ResourceType.TyndaleBibleDictionary}
                    resources={tyndaleBibleDictionaryResources}
                    resourceSelected={handleTextResourceSelected}
                    isFullscreen={false}
                    showTypeFullscreen={(type) => (currentFullscreenTextResourceSectionType = type)}
                    {searchQuery}
                />
            </div>
            {#if filteredResourceCount === 0}
                <NoResourcesFound {searchQuery} />
            {/if}
        {/if}
    </div>
</div>

<style lang="postcss">
    :global(.cupertino-pane-wrapper .backdrop) {
        z-index: 30;
    }
    :global(.cupertino-pane-wrapper .pane) {
        @apply bg-primary-content;
        z-index: 35;
        cursor: initial !important;
    }
</style>
