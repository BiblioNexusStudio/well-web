<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import type { ResourceContentInfoWithMetadata } from '$lib/types/resource';
    import {
        filterItemsByKeyMatchingSearchQuery,
        htmlWithHighlightedSearchString,
        shouldSearch,
    } from '$lib/utils/search';
    import type { LibraryResourceGrouping } from '../library-resource-loader';
    import NoResourcesFound from './NoResourcesFound.svelte';
    import ResourceFullscreenHeader from './ResourceFullscreenHeader.svelte';
    import ResourceSectionHeader from './ResourceSectionHeader.svelte';
    import { _ as translate } from 'svelte-i18n';
    import { titleObjectFromResourceGrouping, titleWithSubtitleFromResourceGrouping } from './titles';

    const imagesToShowBeforeSeeAll = 3;

    export let resourceGrouping: LibraryResourceGrouping;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let searchQuery: string;
    export let skipClientSideFiltering: boolean;
    export let showAll: () => void;
    export let dismissFullscreen: () => void;
    export let isFullscreen: boolean;

    let carousel: HTMLDivElement | null = null;

    $: unfilteredResources =
        !isFullscreen && !filterResultsClientSide
            ? resourceGrouping.resources.slice(0, imagesToShowBeforeSeeAll)
            : resourceGrouping.resources;

    $: filterResultsClientSide = shouldSearch(searchQuery) && !skipClientSideFiltering;

    // resources filtered to:
    // - searched results if searching OR
    // - all resources if fullscreen OR
    // - first X resources
    $: showingResources = filterResultsClientSide
        ? filterItemsByKeyMatchingSearchQuery(resourceGrouping.resources, 'displayName', searchQuery)
        : isFullscreen
        ? resourceGrouping.resources
        : resourceGrouping.resources.slice(0, imagesToShowBeforeSeeAll);

    // if the user clears the search, scroll the carousel back to the left
    $: !shouldSearch(searchQuery) && carousel?.scrollTo({ left: 0, behavior: 'instant' });
</script>

{#if resourceGrouping.resources.length > 0}
    {#if isFullscreen}
        <ResourceFullscreenHeader
            title={titleWithSubtitleFromResourceGrouping(resourceGrouping)}
            resourcesCount={showingResources.length}
            {dismissFullscreen}
            bind:searchQuery
        />
    {:else}
        <ResourceSectionHeader
            isVisible={showingResources.length > 0}
            {...titleObjectFromResourceGrouping(resourceGrouping)}
        >
            {#if !filterResultsClientSide && resourceGrouping.resources.length > imagesToShowBeforeSeeAll}
                <button
                    class="text-sm font-semibold text-base-500"
                    on:click={showAll}
                    data-app-insights-event-name="see-all-resources-clicked"
                    >{$translate('page.passage.resourcePane.seeAll.value', {
                        values: { count: resourceGrouping.resources.length },
                    })}</button
                >
            {/if}</ResourceSectionHeader
        >
    {/if}

    <div
        bind:this={carousel}
        class="carousel w-full pb-6 {isFullscreen && 'mx-auto max-w-[65ch]'} {showingResources.length > 0
            ? 'visible'
            : 'hidden'}"
    >
        {#each unfilteredResources as image}
            <button
                class="carousel-item me-8 w-32 flex-col {showingResources.includes(image) ? 'visible' : 'hidden'}"
                on:click={() => resourceSelected(image)}
                data-app-insights-event-name="image-or-video-resource-clicked"
                data-app-insights-dimensions="resourceContentId,{image.id},resourceName,{image.displayName}"
            >
                <img
                    class="mb-1 h-20 w-32 rounded-lg object-cover"
                    src={cachedOrRealUrl(image.url ?? '')}
                    alt={image.displayName}
                    crossorigin="anonymous"
                />
                <span class="text-md line-clamp-1 break-all font-semibold text-blue-title"
                    >{@html htmlWithHighlightedSearchString(image.displayName ?? '', searchQuery)}</span
                >
            </button>
        {/each}
    </div>
    {#if !isFullscreen && showingResources.length > 0}
        <hr />
    {/if}
    {#if showingResources.length === 0 && isFullscreen}
        <NoResourcesFound {searchQuery} />
    {/if}
{/if}
