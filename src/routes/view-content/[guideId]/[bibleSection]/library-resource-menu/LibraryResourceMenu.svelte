<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import FullscreenMediaResource from './FullscreenMediaResource.svelte';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import { filterItemsByKeyMatchingSearchQuery } from '$lib/utils/search';
    import FullscreenResourceSection from './FullscreenResourceSection.svelte';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import NoResourcesFound from './NoResourcesFound.svelte';
    import AnyResourceSection from './AnyResourceSection.svelte';
    import SwishHeader from '$lib/components/SwishHeader.svelte';
    import FullscreenTextResource from './FullscreenTextResource.svelte';
    import {
        MediaType,
        ParentResourceType,
        SrvResources,
        type ResourceContentInfo,
        type ResourceContentInfoWithMetadata,
        type TextResourceContentJustId,
    } from '$lib/types/resource';
    import {
        buildLibraryResourceGroupingsWithMetadata,
        type LibraryResourceGrouping,
        type LibraryResourceSubgrouping,
    } from '../library-resource-loader';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { get } from 'svelte/store';
    import { currentLanguageDirection, currentLanguageInfo } from '$lib/stores/language.store';
    import { searchResourcesEndpoint } from '$lib/api-endpoints';
    import { debounce } from '$lib/utils/debounce';
    import { settings } from '$lib/stores/settings.store';
    import { SettingShortNameEnum } from '$lib/types/settings';
    import FullscreenResourceSubgroup from './FullscreenResourceSubgroup.svelte';
    import type { ContentTabEnum } from '../context';

    export let resources: ResourceContentInfo[] | undefined;
    export let isLoading = true;
    export let tab: ContentTabEnum;
    export let fullscreenTextResourceStacksByTab: Map<
        ContentTabEnum,
        (ResourceContentInfoWithMetadata | TextResourceContentJustId)[]
    >;
    export let isShowing: boolean;
    export let isFullLibrary: boolean;

    let searchQuery: string = '';
    let hasQuery: boolean = false;

    let resourceGroupings: LibraryResourceGrouping[];
    let flatResources: ResourceContentInfoWithMetadata[] = [];
    let mediaResources: ResourceContentInfoWithMetadata[] = [];

    $: prepareResources(resources || [], isShowing);

    $: filteredResourceCount = filterItemsByKeyMatchingSearchQuery(flatResources, 'displayName', searchQuery).length;
    $: hasQuery = searchQuery != '';

    let currentFullscreenMediaResourceIndex: number | null = null;
    let currentFullscreenResourceGrouping: LibraryResourceGrouping | null = null;
    let currentFullscreenResourceSubgrouping: LibraryResourceSubgrouping | null = null;

    let visibleSwish = isFullLibrary;

    $: searchQueryChanged(searchQuery);
    $: showOnlySrvResources = !!$settings.find(
        (setting) => setting.shortName === SettingShortNameEnum.showOnlySrvResources
    )?.value;

    function onHandleSearchFocus() {
        if (!hasQuery && isFullLibrary) {
            visibleSwish = !visibleSwish;
        }
    }

    function resetPage(e: MouseEvent) {
        e.stopPropagation();
        visibleSwish = true;
        searchQuery = '';
        return null;
    }

    async function searchQueryChanged(query: string) {
        if (isFullLibrary) {
            if (query.length < 3) {
                resources = undefined;
            } else {
                isLoading = true;
                debouncedFetchSearchResultsFromApi(query);
            }
        }
    }

    const debouncedFetchSearchResultsFromApi = debounce(async (query: string) => {
        if (query.length < 3) {
            resources = undefined;
        } else {
            const currentLanguageId = get(currentLanguageInfo)?.id;
            const allResources = (await fetchFromCacheOrApi(
                ...searchResourcesEndpoint(currentLanguageId, query, [
                    ParentResourceType.Images,
                    ParentResourceType.Dictionary,
                    ParentResourceType.Videos,
                ])
            )) as ResourceContentInfo[];
            resources = allResources.filter(
                (rc) => !showOnlySrvResources || SrvResources.includes(rc.parentResourceId)
            );
        }
    }, 750);

    function resourceSelected(resource: ResourceContentInfoWithMetadata) {
        if (resource.mediaType === MediaType.Image || resource.mediaType === MediaType.Video) {
            currentFullscreenMediaResourceIndex = mediaResources.indexOf(resource);
        } else {
            const fullscreenTextResourceStack = fullscreenTextResourceStacksByTab.get(tab) ?? [];
            fullscreenTextResourceStack.push(resource);
            fullscreenTextResourceStacksByTab.set(tab, fullscreenTextResourceStack);
            fullscreenTextResourceStacksByTab = fullscreenTextResourceStacksByTab;
        }
    }

    function subgroupSelected(subgroup: LibraryResourceSubgrouping | null) {
        currentFullscreenResourceSubgrouping = subgroup;
    }

    function showResourceGroupingFullscreen(resourceGrouping: LibraryResourceGrouping | null) {
        currentFullscreenResourceGrouping = resourceGrouping;
    }

    async function prepareResources(resources: ResourceContentInfo[], isShowing: boolean) {
        if (!isShowing || (!isFullLibrary && resourceGroupings?.length > 0)) return;
        isLoading = true;

        resourceGroupings = await buildLibraryResourceGroupingsWithMetadata(resources, $currentLanguageDirection);
        flatResources = resourceGroupings.flatMap(({ resources }) => resources);
        mediaResources = flatResources.filter(
            (r) => r.mediaType === MediaType.Image || r.mediaType === MediaType.Video
        );

        isLoading = false;
    }
</script>

{#if isShowing}
    <SwishHeader
        bind:visible={visibleSwish}
        title={$translate('page.passage.resourcePane.libraryTitle.value')}
        subtitle={$translate('page.passage.resourcePane.librarySubtitle.value')}
        bgcolor="bg-[#439184]"
    />

    <FullscreenMediaResource bind:currentIndex={currentFullscreenMediaResourceIndex} resources={mediaResources} />
    <FullscreenResourceSection
        {currentFullscreenResourceGrouping}
        {subgroupSelected}
        {resourceSelected}
        {showResourceGroupingFullscreen}
    />
    <FullscreenResourceSubgroup
        {currentFullscreenResourceSubgrouping}
        {resourceSelected}
        dismissFullscreen={() => subgroupSelected(null)}
    />
    <FullscreenTextResource {tab} bind:fullscreenTextResourceStacksByTab />

    <div
        class="absolute bottom-20 left-0 right-0 {visibleSwish
            ? 'top-40'
            : isFullLibrary
            ? 'top-0'
            : 'top-16'} flex flex-col px-4 transition-[top] duration-500 ease-in-out"
    >
        <div class="my-4 flex flex-row">
            <SearchInput bind:searchQuery onFocus={onHandleSearchFocus} />
            {#if !visibleSwish && isFullLibrary}
                <div>
                    <button
                        on:click={(e) => resetPage(e)}
                        type="button"
                        class="mt-2 ps-4 font-semibold text-primary"
                        data-app-insights-event-name="library-menu-reset-page-button-clicked"
                        >{$translate('page.passage.resourcePane.cancel.value')}</button
                    >
                </div>
            {/if}
        </div>
        {#if isLoading}
            <FullPageSpinner />
        {:else if !resources}
            <div class="flex flex-grow flex-col items-center justify-items-center overflow-y-scroll">
                <div class="mb-4 flex-shrink-0 text-sm text-neutral">
                    {$translate('page.passage.resourcePane.typeToSearch.value')}
                </div>
            </div>
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
            <div class="overflow-y-scroll">
                {#each resourceGroupings as resourceGrouping}
                    <AnyResourceSection
                        {resourceGrouping}
                        isFullscreen={false}
                        {searchQuery}
                        skipClientSideFiltering={isFullLibrary}
                        {resourceSelected}
                        {subgroupSelected}
                        {showResourceGroupingFullscreen}
                    />
                {/each}
            </div>
        {/if}
    </div>
{/if}
