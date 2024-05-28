<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import type { ResourceContentInfoWithMetadata } from '$lib/types/resource';
    import {
        filterItemsByKeyMatchingSearchQuery,
        htmlWithHighlightedSearchString,
        shouldSearch,
    } from '$lib/utils/search';
    import { formatSecondsToMins } from '$lib/utils/time';
    import type { LibraryResourceGrouping } from '../library-resource-loader';
    import ResourceSectionHeader from './ResourceSectionHeader.svelte';
    import { Icon } from 'svelte-awesome';
    import play from 'svelte-awesome/icons/play';
    import { _ as translate } from 'svelte-i18n';
    import ResourceFullscreenHeader from './ResourceFullscreenHeader.svelte';
    import NoResourcesFound from './NoResourcesFound.svelte';

    const videosToShowBeforeSeeAll = 3;

    export let resourceGrouping: LibraryResourceGrouping;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let searchQuery: string;
    export let skipClientSideFiltering: boolean;
    export let isFullscreen: boolean;
    export let showAll: () => void;
    export let dismissFullscreen: () => void;

    let carousel: HTMLDivElement | null = null;

    $: filterResultsClientSide = shouldSearch(searchQuery) && !skipClientSideFiltering;

    $: unfilteredResources =
        !isFullscreen && !filterResultsClientSide
            ? resourceGrouping.resources.slice(0, videosToShowBeforeSeeAll)
            : resourceGrouping.resources;

    // resources filtered to:
    // - searched results if searching OR
    // - all resources if fullscreen OR
    // - first X resources
    $: showingResources = filterResultsClientSide
        ? filterItemsByKeyMatchingSearchQuery(resourceGrouping.resources, 'displayName', searchQuery)
        : isFullscreen
        ? resourceGrouping.resources
        : resourceGrouping.resources.slice(0, videosToShowBeforeSeeAll);

    // if the user clears the search, scroll the carousel back to the left
    $: !shouldSearch(searchQuery) && carousel?.scrollTo({ left: 0, behavior: 'instant' });
</script>

{#if resourceGrouping.resources.length > 0}
    {#if isFullscreen}
        <ResourceFullscreenHeader
            {resourceGrouping}
            resourcesCount={showingResources.length}
            {dismissFullscreen}
            bind:searchQuery
        />
    {:else}
        <ResourceSectionHeader isVisible={showingResources.length > 0} {resourceGrouping}>
            {#if !filterResultsClientSide && resourceGrouping.resources.length > videosToShowBeforeSeeAll}
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
        {#each unfilteredResources as video}
            <button
                class="carousel-item me-2 w-32 flex-col {showingResources.includes(video) ? 'visible' : 'hidden'}"
                on:click={() => resourceSelected(video)}
                data-app-insights-event-name="video-resource-button-clicked"
            >
                <div class="relative mb-1">
                    {#if video.duration}
                        <div
                            class="absolute bottom-1.5 left-1.5 flex flex-row items-center rounded-lg bg-black bg-opacity-80 p-1 pe-1.5 ps-2
                            text-gray-25"
                        >
                            <Icon data={play} scale={0.5} />
                            <div class="ps-1 text-xs font-semibold">{formatSecondsToMins(video.duration)}</div>
                        </div>
                    {/if}
                    {#if video.thumbnailUrl}
                        <img
                            class="h-20 w-32 rounded-lg object-cover"
                            src={cachedOrRealUrl(video.thumbnailUrl)}
                            alt={video.displayName}
                            crossorigin="anonymous"
                        />
                    {:else}
                        <div class="h-20 w-32 rounded-lg bg-gray-50">
                            <div class="mx-auto pt-4 text-sm text-secondary-content">
                                {$translate('page.passage.resourcePane.noThumbnail.value')}
                            </div>
                        </div>
                    {/if}
                </div>
                <span class="line-clamp-1 break-all text-sm text-neutral"
                    >{@html htmlWithHighlightedSearchString(video.displayName ?? '', searchQuery)}</span
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
