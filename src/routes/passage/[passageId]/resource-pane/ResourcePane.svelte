<script lang="ts">
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { PassageResourceContent } from '$lib/types/passage';
    import { MediaType, ResourceType, type ResourceTypeEnum } from '$lib/types/resource';
    import { asyncMap } from '$lib/utils/async-array';
    import {
        fetchDisplayNameForResourceContent,
        fetchMetadataForResourceContent,
        fetchTiptapForResourceContent,
        resourceContentApiFullUrl,
        resourceDisplayNameSorter,
        resourceThumbnailApiFullUrl,
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
    import { isOnline } from '$lib/stores/is-online.store';
    import { get } from 'svelte/store';
    import { isCachedFromCdn } from '$lib/data-cache';

    export let resourcePane: CupertinoPane;
    export let isShowing: boolean;
    export let resources: PassageResourceContent[] | undefined;
    export let activeTab: 'basic' | 'advanced' | 'searching' = 'basic';
    export let isLoading = true;

    let searchQuery: string = '';
    let previousResourceIds = (resources ?? []).map(({ contentId }) => contentId);

    $: showBasicTab =
        ubsImageResources.length > 0 ||
        videoBibleDictionaryResources.length > 0 ||
        biblicaStudyNotesResources.length > 0 ||
        biblicaBibleDictionaryResources.length > 0;
    $: showAdvancedTab = tyndaleBibleDictionaryResources.length > 0 || tyndaleStudyNotesResources.length > 0;
    $: activeTab = shouldSearch(searchQuery) ? 'searching' : showBasicTab ? 'basic' : 'advanced';

    // text resources
    let tyndaleBibleDictionaryResources: TextResource[] = [];
    let tyndaleStudyNotesResources: TextResource[] = [];
    let biblicaBibleDictionaryResources: TextResource[] = [];
    let biblicaStudyNotesResources: TextResource[] = [];
    let textResourcesByType = {} as Record<ResourceTypeEnum, TextResource[]>;
    $: textResources = tyndaleBibleDictionaryResources
        .concat(tyndaleStudyNotesResources)
        .concat(biblicaStudyNotesResources)
        .concat(biblicaBibleDictionaryResources);

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
        const bottomBarHeight = parseFloat(getComputedStyle(document.documentElement).fontSize) * 4;
        resourcePane = new CupertinoPane('#resource-pane', {
            parentElement: '#passage-page',
            buttonDestroy: false,
            bottomClose: true,
            fastSwipeClose: true,
            initialBreak: 'top',
            breaks: {
                top: {
                    enabled: true,
                    height: window.innerHeight - 50 - bottomBarHeight,
                },
                middle: { enabled: false },
                bottom: { enabled: false, height: window.screen.height - 300 },
            },
            lowerThanBottom: true,
            backdrop: true,
            backdropOpacity: 0.4,
            simulateTouch: false,
            bottomOffset: bottomBarHeight,
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
        const currentResourceIds = resources.map(({ contentId }) => contentId);
        if (JSON.stringify(previousResourceIds) === JSON.stringify(currentResourceIds)) {
            return;
        }
        previousResourceIds = currentResourceIds;
        isLoading = true;
        const textResources = (
            await asyncMap(
                resources.filter(({ mediaTypeName }) => mediaTypeName === MediaType.Text),
                async (resource) => {
                    const [displayName, tiptap] = await Promise.all([
                        fetchDisplayNameForResourceContent(resource),
                        fetchTiptapForResourceContent(resource),
                    ]);
                    if (tiptap) {
                        return {
                            displayName,
                            html: parseTiptapJsonToHtml(tiptap.tiptap, { excludeHeader1: true }),
                            preview: parseTiptapJsonToText(tiptap.tiptap, { excludeHeader1: true }).slice(0, 100),
                            typeName: resource.typeName,
                        };
                    } else {
                        return null;
                    }
                }
            )
        ).filter(Boolean) as TextResource[];
        tyndaleBibleDictionaryResources = textResources
            .filter(({ typeName }) => typeName === ResourceType.TyndaleBibleDictionary)
            .sort(resourceDisplayNameSorter);
        tyndaleStudyNotesResources = textResources
            .filter(({ typeName }) => typeName === ResourceType.TyndaleStudyNotes)
            .sort(resourceDisplayNameSorter);
        biblicaStudyNotesResources = textResources
            .filter(({ typeName }) => typeName === ResourceType.BiblicaStudyNotes)
            .sort(resourceDisplayNameSorter);
        biblicaBibleDictionaryResources = textResources
            .filter(({ typeName }) => typeName === ResourceType.BiblicaBibleDictionary)
            .sort(resourceDisplayNameSorter);
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
            async (resource) => {
                const metadata = await fetchMetadataForResourceContent(resource);
                const thumbnailUrl = resourceThumbnailApiFullUrl(resource);
                return {
                    type: 'video',
                    displayName: metadata?.displayName || null,
                    url: resourceContentApiFullUrl(resource),
                    duration: metadata?.metadata?.['duration'] as number | undefined,
                    thumbnailUrl: get(isOnline) || (await isCachedFromCdn(thumbnailUrl)) ? thumbnailUrl : undefined,
                };
            }
        );
        textResourcesByType.TyndaleBibleDictionary = tyndaleBibleDictionaryResources;
        textResourcesByType.TyndaleStudyNotes = tyndaleStudyNotesResources;
        textResourcesByType.BiblicaBibleDictionary = biblicaBibleDictionaryResources;
        textResourcesByType.BiblicaStudyNotes = biblicaStudyNotesResources;
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
    <div class="flex h-full flex-col px-4">
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
                                ? 'tab-active !border-b-2 !border-primary-focus text-primary-focus'
                                : '!border-b border-b-gray-200 text-gray-500'}"
                            on:click={() => (activeTab = 'basic')}
                            >{$translate('page.passage.resourcePane.basicTab.value')}</button
                        >
                    {/if}
                    {#if showAdvancedTab}
                        <button
                            class="tab tab-bordered text-sm font-semibold {activeTab === 'advanced'
                                ? 'tab-active !border-b-2 !border-primary-focus text-primary-focus'
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
                    title={$translate('resources.types.ubsImages.value')}
                    resources={ubsImageResources}
                    resourceSelected={handleMediaResourceSelected}
                    {searchQuery}
                />
                <VideoResourceSection
                    title={$translate('resources.types.videoBibleDictionary.value')}
                    resources={videoBibleDictionaryResources}
                    resourceSelected={handleMediaResourceSelected}
                    {searchQuery}
                />
                <TextResourceSection
                    type={ResourceType.BiblicaStudyNotes}
                    resources={biblicaStudyNotesResources}
                    resourceSelected={handleTextResourceSelected}
                    isFullscreen={false}
                    showTypeFullscreen={(type) => (currentFullscreenTextResourceSectionType = type)}
                    {searchQuery}
                />
                <TextResourceSection
                    type={ResourceType.BiblicaBibleDictionary}
                    resources={biblicaBibleDictionaryResources}
                    resourceSelected={handleTextResourceSelected}
                    isFullscreen={false}
                    showTypeFullscreen={(type) => (currentFullscreenTextResourceSectionType = type)}
                    {searchQuery}
                />
            </div>
            <div class={activeTab === 'advanced' || activeTab === 'searching' ? 'visible' : 'hidden'}>
                <TextResourceSection
                    type={ResourceType.TyndaleStudyNotes}
                    resources={tyndaleStudyNotesResources}
                    resourceSelected={handleTextResourceSelected}
                    isFullscreen={false}
                    showTypeFullscreen={(type) => (currentFullscreenTextResourceSectionType = type)}
                    {searchQuery}
                />
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
