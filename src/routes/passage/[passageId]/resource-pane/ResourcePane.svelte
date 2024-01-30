<script lang="ts">
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { PassageResourceContent } from '$lib/types/passage';
    import {
        MediaType,
        ParentResourceComplexityLevel,
        ParentResourceType,
        type ApiParentResource,
    } from '$lib/types/resource';
    import { asyncMap } from '$lib/utils/async-array';
    import {
        fetchDisplayNameForResourceContent,
        fetchMetadataForResourceContent,
        fetchTiptapForResourceContent,
        resourceContentApiFullUrl,
        resourceDisplayNameSorter,
        resourceThumbnailApiFullUrl,
    } from '$lib/utils/data-handlers/resources/resource';
    import type { AnyResource, ImageOrVideoResource, ResourcePaneTab, TextResource } from './types';
    import FullscreenMediaResource from './FullscreenMediaResource.svelte';
    import FullscreenTextResource from './FullscreenTextResource.svelte';
    import { parseTiptapJsonToHtml, parseTiptapJsonToText } from '$lib/utils/tiptap-parsers';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import { filterItemsByKeyMatchingSearchQuery, shouldSearch } from '$lib/utils/search';
    import FullscreenTextResourceSection from './FullscreenTextResourceSection.svelte';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import NoResourcesFound from './NoResourcesFound.svelte';
    import { isOnline } from '$lib/stores/is-online.store';
    import { get } from 'svelte/store';
    import { isCachedFromCdn } from '$lib/data-cache';
    import { groupBy } from '$lib/utils/array';
    import { objectEntries } from '$lib/utils/typesafe-standard-lib';
    import { parentResourceNameToInfoMap } from '$lib/stores/parent-resource.store';
    import AnyResourceSection from './AnyResourceSection.svelte';

    const RESOURCE_TYPE_ORDER: ParentResourceType[] = [
        ParentResourceType.Images,
        ParentResourceType.Videos,
        ParentResourceType.StudyNotes,
        ParentResourceType.Dictionary,
    ];

    export let resourcePane: CupertinoPane;
    export let isShowing: boolean;
    export let resources: PassageResourceContent[] | undefined;
    export let activeTab: ResourcePaneTab = 'basic';
    export let isLoading = true;

    let searchQuery: string = '';
    let previousResourceIds = (resources ?? []).map(({ contentId }) => contentId);

    let hasBasicResources = false;
    let hasAdvancedResources = false;

    $: activeTab = shouldSearch(searchQuery) ? 'searching' : hasBasicResources ? 'basic' : 'advanced';

    let allResources: AnyResource[] = [];
    let mediaResources: ImageOrVideoResource[] = [];
    let sortedResourceGroups: {
        parentResource: ApiParentResource;
        resources: AnyResource[];
    }[] = [];
    let groupedResources: Record<string, AnyResource[]> = {};

    $: prepareResources(resources || []);

    $: filteredResourceCount = filterItemsByKeyMatchingSearchQuery(allResources, 'displayName', searchQuery).length;

    let currentFullscreenMediaResourceIndex: number | null = null;
    let currentFullscreenTextResource: TextResource | null = null;
    let currentFullscreenTextParentResourceName: string | null;

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

    function resourceSelected(resource: AnyResource) {
        if ('type' in resource) {
            currentFullscreenMediaResourceIndex = mediaResources.indexOf(resource);
        } else {
            currentFullscreenTextResource = resource;
        }
    }

    function showParentResourceFullscreen(parentResourceName: string | null) {
        currentFullscreenTextParentResourceName = parentResourceName;
    }

    async function prepareResources(resources: PassageResourceContent[]) {
        const currentResourceIds = resources.map(({ contentId }) => contentId);
        if (JSON.stringify(previousResourceIds) === JSON.stringify(currentResourceIds)) {
            return;
        }
        previousResourceIds = currentResourceIds;
        isLoading = true;

        const textResources = (
            (
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
                                parentResourceName: resource.parentResourceName,
                            };
                        } else {
                            return null;
                        }
                    }
                )
            ).filter(Boolean) as TextResource[]
        ).sort(resourceDisplayNameSorter);

        mediaResources = (
            (
                await asyncMap(
                    resources.filter(({ mediaTypeName }) => mediaTypeName === MediaType.Image),
                    async (resource) => ({
                        type: 'image',
                        displayName: await fetchDisplayNameForResourceContent(resource),
                        url: resourceContentApiFullUrl(resource),
                        parentResourceName: resource.parentResourceName,
                    })
                )
            )
                .concat(
                    await asyncMap(
                        resources.filter(({ mediaTypeName }) => mediaTypeName === MediaType.Video),
                        async (resource) => {
                            const metadata = await fetchMetadataForResourceContent(resource);
                            const thumbnailUrl = resourceThumbnailApiFullUrl(resource);
                            return {
                                type: 'video',
                                displayName: metadata?.displayName || null,
                                url: resourceContentApiFullUrl(resource),
                                duration: metadata?.metadata?.['duration'] as number | undefined,
                                parentResourceName: resource.parentResourceName,
                                thumbnailUrl:
                                    get(isOnline) || (await isCachedFromCdn(thumbnailUrl)) ? thumbnailUrl : undefined,
                            };
                        }
                    )
                )
                .filter(Boolean) as ImageOrVideoResource[]
        ).sort(resourceDisplayNameSorter);

        allResources = (textResources as AnyResource[]).concat(mediaResources);
        hasBasicResources = allResources.some(
            (r) =>
                $parentResourceNameToInfoMap[r.parentResourceName]?.complexityLevel ===
                ParentResourceComplexityLevel.Basic
        );
        hasAdvancedResources = allResources.some(
            (r) =>
                $parentResourceNameToInfoMap[r.parentResourceName]?.complexityLevel ===
                ParentResourceComplexityLevel.Advanced
        );
        groupedResources = groupBy(
            allResources,
            (r) => r.parentResourceName,
            (v) => v
        );
        sortedResourceGroups = (
            objectEntries(groupedResources)
                .map(([parentResourceName, resources]) => {
                    return { parentResource: $parentResourceNameToInfoMap[parentResourceName], resources };
                })
                .filter((r) => r.parentResource) as typeof sortedResourceGroups
        ).sort((a, b) => {
            return (
                RESOURCE_TYPE_ORDER.indexOf(a.parentResource.resourceType) -
                RESOURCE_TYPE_ORDER.indexOf(b.parentResource.resourceType)
            );
        });
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
            } else if (currentFullscreenTextParentResourceName !== null) {
                currentFullscreenTextParentResourceName = null;
            } else if (isShowing) {
                isShowing = false;
            }
        }
    }}
/>

<FullscreenMediaResource bind:currentIndex={currentFullscreenMediaResourceIndex} resources={mediaResources} />
<FullscreenTextResource bind:resource={currentFullscreenTextResource} />
<FullscreenTextResourceSection
    parentResourceName={currentFullscreenTextParentResourceName}
    {groupedResources}
    {resourceSelected}
    dismissParentResourceFullscreen={() => (currentFullscreenTextParentResourceName = null)}
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
                    {#if hasBasicResources}
                        <button
                            class="tab-bordered tab text-sm font-semibold {activeTab === 'basic'
                                ? '!border-primary-focus text-primary-focus tab-active !border-b-2'
                                : '!border-b border-b-gray-200 text-gray-500'}"
                            on:click={() => (activeTab = 'basic')}
                            >{$translate('page.passage.resourcePane.basicTab.value')}</button
                        >
                    {/if}
                    {#if hasAdvancedResources}
                        <button
                            class="tab-bordered tab text-sm font-semibold {activeTab === 'advanced'
                                ? '!border-primary-focus text-primary-focus tab-active !border-b-2'
                                : '!border-b border-b-gray-200 text-gray-500'}"
                            on:click={() => (activeTab = 'advanced')}
                            >{$translate('page.passage.resourcePane.advancedTab.value')}</button
                        >
                    {/if}
                    <div class="flex-grow border-b border-b-gray-200" />
                </div>
            {/if}
            <div>
                {#each sortedResourceGroups as { parentResource, resources }}
                    <AnyResourceSection
                        {activeTab}
                        {parentResource}
                        {resources}
                        {searchQuery}
                        {resourceSelected}
                        {showParentResourceFullscreen}
                    />
                {/each}
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
