<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import {
        MediaType,
        ParentResourceType,
        type ApiParentResource,
        type ResourceContentInfo,
        ParentResourceId,
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
    import type { AnyResource, ImageOrVideoResource, TextResource } from './types';
    import FullscreenMediaResource from './FullscreenMediaResource.svelte';
    import FullscreenTextResource from './FullscreenTextResource.svelte';
    import { parseTiptapJsonToHtml, parseTiptapJsonToText } from '$lib/utils/tiptap-parsers';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import { filterItemsByKeyMatchingSearchQuery } from '$lib/utils/search';
    import FullscreenTextResourceSection from './FullscreenTextResourceSection.svelte';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import NoResourcesFound from './NoResourcesFound.svelte';
    import { isOnline } from '$lib/stores/is-online.store';
    import { get } from 'svelte/store';
    import { isCachedFromCdn } from '$lib/data-cache';
    import { groupBy } from '$lib/utils/array';
    import { objectEntries } from '$lib/utils/typesafe-standard-lib';
    import { parentResourceIdToInfoMap } from '$lib/stores/parent-resource.store';
    import AnyResourceSection from './AnyResourceSection.svelte';
    import SwishHeader from '$lib/components/SwishHeader.svelte';

    const RESOURCE_TYPE_ORDER: ParentResourceType[] = [
        ParentResourceType.Images,
        ParentResourceType.Videos,
        ParentResourceType.StudyNotes,
        ParentResourceType.Dictionary,
    ];

    export let resources: ResourceContentInfo[] | undefined;
    export let isLoading = true;

    let searchQuery: string = '';
    let hasQuery: boolean = false;
    let previousResourceIds = (resources ?? []).map(({ id }) => id);

    let allResources: AnyResource[] = [];
    let mediaResources: ImageOrVideoResource[] = [];
    let sortedResourceGroups: {
        parentResource: ApiParentResource;
        resources: AnyResource[];
    }[] = [];
    let groupedResources: Partial<Record<ParentResourceId, AnyResource[]>> = {};

    $: prepareResources(resources || []);

    $: filteredResourceCount = filterItemsByKeyMatchingSearchQuery(allResources, 'displayName', searchQuery).length;
    $: hasQuery = searchQuery != '';

    let currentFullscreenMediaResourceIndex: number | null = null;
    let currentFullscreenTextResource: TextResource | null = null;
    let currentFullscreenTextParentResourceId: ParentResourceId | null;

    let visibleSwish = true;

    function onHandleSearchFocus() {
        if (!hasQuery) {
            visibleSwish = !visibleSwish;
        }
    }

    function resetPage(e: MouseEvent) {
        e.stopPropagation();
        visibleSwish = true;
        searchQuery = '';
        return null;
    }

    function resourceSelected(resource: AnyResource) {
        if ('type' in resource) {
            currentFullscreenMediaResourceIndex = mediaResources.indexOf(resource);
        } else {
            currentFullscreenTextResource = resource;
        }
    }

    function showParentResourceFullscreen(parentResourceId: ParentResourceId | null) {
        currentFullscreenTextParentResourceId = parentResourceId;
    }

    async function prepareResources(resources: ResourceContentInfo[]) {
        const currentResourceIds = resources.map(({ id }) => id);
        if (JSON.stringify(previousResourceIds) === JSON.stringify(currentResourceIds && allResources.length > 0)) {
            return;
        }
        previousResourceIds = currentResourceIds;
        isLoading = true;

        const textResources = (
            (
                await asyncMap(
                    resources.filter(({ mediaType }) => mediaType === MediaType.Text),
                    async (resource) => {
                        const [displayName, tiptap] = await Promise.all([
                            fetchDisplayNameForResourceContent(resource),
                            fetchTiptapForResourceContent(resource),
                        ]);
                        if (tiptap) {
                            return {
                                displayName,
                                html: parseTiptapJsonToHtml(tiptap.tiptap),
                                preview: parseTiptapJsonToText(tiptap.tiptap).slice(0, 100),
                                parentResourceId: resource.parentResourceId,
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
                    resources.filter(({ mediaType }) => mediaType === MediaType.Image),
                    async (resource) => ({
                        type: 'image',
                        displayName: await fetchDisplayNameForResourceContent(resource),
                        url: resourceContentApiFullUrl(resource),
                        parentResourceId: resource.parentResourceId,
                    })
                )
            )
                .concat(
                    await asyncMap(
                        resources.filter(({ mediaType }) => mediaType === MediaType.Video),
                        async (resource) => {
                            const metadata = await fetchMetadataForResourceContent(resource);
                            const thumbnailUrl = resourceThumbnailApiFullUrl(resource);
                            return {
                                type: 'video',
                                displayName: metadata?.displayName || null,
                                url: resourceContentApiFullUrl(resource),
                                duration: metadata?.metadata?.['duration'] as number | undefined,
                                parentResourceId: resource.parentResourceId,
                                thumbnailUrl:
                                    get(isOnline) || (await isCachedFromCdn(thumbnailUrl)) ? thumbnailUrl : undefined,
                            };
                        }
                    )
                )
                .filter(Boolean) as ImageOrVideoResource[]
        ).sort(resourceDisplayNameSorter);

        allResources = (textResources as AnyResource[]).concat(mediaResources);

        groupedResources = groupBy(
            allResources,
            (r) => r.parentResourceId,
            (v) => v
        );

        sortedResourceGroups = (
            objectEntries(groupedResources)
                .map(([parentResourceId, resources]) => {
                    return {
                        parentResource: $parentResourceIdToInfoMap[parentResourceId],
                        resources,
                    };
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

<SwishHeader
    bind:visible={visibleSwish}
    title={$translate('page.passage.resourcePane.libraryTitle.value')}
    subtitle={$translate('page.passage.resourcePane.librarySubtitle.value')}
    bgcolor="bg-[#439184]"
/>

<FullscreenMediaResource bind:currentIndex={currentFullscreenMediaResourceIndex} resources={mediaResources} />
<FullscreenTextResource bind:resource={currentFullscreenTextResource} />
<FullscreenTextResourceSection
    parentResourceId={currentFullscreenTextParentResourceId}
    parentResourceIdToInfoMap={$parentResourceIdToInfoMap}
    {groupedResources}
    {resourceSelected}
    dismissParentResourceFullscreen={() => (currentFullscreenTextParentResourceId = null)}
/>

<div class="flex flex-col px-4">
    <div class="mb-8 flex flex-row {visibleSwish ? '-mt-12' : 'mt-4'}">
        <SearchInput bind:searchQuery onFocus={onHandleSearchFocus} />
        {#if !visibleSwish}
            <div>
                <button on:click={(e) => resetPage(e)} type="button" class="mt-2 pl-4 font-semibold text-primary"
                    >{$translate('page.passage.resourcePane.cancel.value')}</button
                >
            </div>
        {/if}
    </div>
    {#if !hasQuery}
        <div class="flex flex-grow flex-col items-center justify-items-center overflow-y-scroll">
            <div class="mb-4 flex-shrink-0 text-sm text-neutral">
                {$translate('page.passage.resourcePane.typeToSearch.value')}
            </div>
        </div>
    {:else if isLoading}
        <FullPageSpinner />
    {:else if filteredResourceCount === 0}
        <NoResourcesFound {searchQuery} />
    {:else}
        <div class="flex flex-col items-center justify-items-center">
            <div class="mb-4 flex-shrink-0 text-sm text-neutral">
                {filteredResourceCount == 1
                    ? $translate('page.passage.resourcePane.resourceCount.singular.value')
                    : $translate('page.passage.resourcePane.resourceCount.plural.value', {
                          values: { count: filteredResourceCount },
                      })}
            </div>
        </div>
        <div class="pb-20">
            {#each sortedResourceGroups as { parentResource, resources }}
                <AnyResourceSection
                    {parentResource}
                    {resources}
                    {searchQuery}
                    {resourceSelected}
                    {showParentResourceFullscreen}
                />
            {/each}
        </div>
    {/if}
</div>
