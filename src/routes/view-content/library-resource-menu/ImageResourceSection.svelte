<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import type { ResourceContentInfoWithMetadata } from '$lib/types/resource';
    import {
        filterItemsByKeyMatchingSearchQuery,
        htmlWithHighlightedSearchString,
        shouldSearch,
    } from '$lib/utils/search';
    import type { LibraryResourceGrouping } from '../library-resource-loader';
    import ResourceFullscreenHeader from './ResourceFullscreenHeader.svelte';
    import ResourceSectionHeader from './ResourceSectionHeader.svelte';
    import { _ as translate } from 'svelte-i18n';

    const imagesToShowBeforeSeeAll = 3;

    export let resourceGrouping: LibraryResourceGrouping;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let searchQuery: string;
    export let showAll: () => void;
    export let dismissFullscreen: () => void;
    export let isFullscreen: boolean;

    let carousel: HTMLDivElement | null = null;

    $: unfilteredResources =
        !isFullscreen && !shouldSearch(searchQuery)
            ? resourceGrouping.resources.slice(0, imagesToShowBeforeSeeAll)
            : resourceGrouping.resources;

    $: filteredResources = !isFullscreen
        ? resourceGrouping.resources.slice(0, imagesToShowBeforeSeeAll)
        : filterItemsByKeyMatchingSearchQuery(resourceGrouping.resources, 'displayName', searchQuery);

    // if the user clears the search, scroll the carousel back to the left
    $: !shouldSearch(searchQuery) && carousel?.scrollTo({ left: 0, behavior: 'instant' });
</script>

{#if resourceGrouping.resources.length > 0}
    {#if isFullscreen}
        <ResourceFullscreenHeader
            {resourceGrouping}
            resourcesCount={filteredResources.length}
            {dismissFullscreen}
            bind:searchQuery
        />
    {:else}
        <ResourceSectionHeader isVisible={filteredResources.length > 0} {resourceGrouping}>
            {#if !shouldSearch(searchQuery) && resourceGrouping.resources.length > imagesToShowBeforeSeeAll}
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
        class="carousel w-full pb-6 {isFullscreen && 'mx-auto max-w-[65ch]'} {filteredResources.length > 0
            ? 'visible'
            : 'hidden'}"
    >
        {#each unfilteredResources as image}
            <button
                class="carousel-item me-8 w-32 flex-col {filteredResources.includes(image) ? 'visible' : 'hidden'}"
                on:click={() => resourceSelected(image)}
                data-app-insights-event-name="image-resource-clicked"
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
    {#if filteredResources.length > 0}
        <hr />
    {/if}
{/if}
