<script lang="ts">
    import {
        filterItemsByKeyMatchingSearchQuery,
        htmlWithHighlightedSearchString,
        shouldSearch,
    } from '$lib/utils/search';
    import { _ as translate } from 'svelte-i18n';
    import NoResourcesFound from './NoResourcesFound.svelte';
    import ResourceSectionHeader from './ResourceSectionHeader.svelte';
    import type { LibraryResourceGrouping } from '../library-resource-loader';
    import ResourceFullscreenHeader from './ResourceFullscreenHeader.svelte';
    import type { ResourceContentInfoWithMetadata } from '$lib/types/resource';

    export let resourceGrouping: LibraryResourceGrouping;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let searchQuery: string;
    export let skipClientSideFiltering: boolean;
    export let isFullscreen: boolean;
    export let showAll: (() => void) | null = null;
    export let dismissFullscreen: () => void;

    $: filterResultsClientSide = shouldSearch(searchQuery) && !skipClientSideFiltering;

    // resources filtered to:
    // - searched results if searching OR
    // - all resources if fullscreen OR
    // - first 5 resources
    $: showingResources = filterResultsClientSide
        ? filterItemsByKeyMatchingSearchQuery(resourceGrouping.resources, 'displayName', searchQuery)
        : isFullscreen
        ? resourceGrouping.resources
        : resourceGrouping.resources.slice(0, 5);
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
            {#if !filterResultsClientSide && resourceGrouping.resources.length > 5}
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

    <div class={isFullscreen ? 'mx-auto w-full max-w-[65ch] overflow-y-scroll pb-4' : 'pb-6'}>
        {#each showingResources as entry}
            <button
                class="mb-4 flex w-full flex-row items-center rounded-full border py-3 ps-4"
                on:click={() => resourceSelected(entry)}
                data-app-insights-event-name="text-resource-clicked"
            >
                <div class="flex flex-shrink flex-col items-start">
                    <div class="text-md text-start font-semibold text-blue-title">
                        {@html htmlWithHighlightedSearchString(entry.displayName ?? '', searchQuery)}
                    </div>
                </div>
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
