<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import {
        filterItemsByKeyMatchingSearchQuery,
        htmlWithHighlightedSearchString,
        shouldSearch,
    } from '$lib/utils/search';
    import type { ImageOrVideoResource } from './types';

    export let title: string;
    export let resources: ImageOrVideoResource[];
    export let resourceSelected: (image: ImageOrVideoResource) => void;
    export let searchQuery: string;

    let carousel: HTMLDivElement | null = null;

    $: filteredResources = filterItemsByKeyMatchingSearchQuery(resources, 'displayName', searchQuery);

    // if the user clears the search, scroll the carousel back to the left
    $: !shouldSearch(searchQuery) && carousel?.scrollTo({ left: 0, behavior: 'instant' });
</script>

{#if resources.length > 0}
    <div class="text-md pb-2 font-semibold text-base-content {filteredResources.length > 0 ? 'visible' : 'hidden'}">
        {title}
    </div>
    <div bind:this={carousel} class="carousel w-full pb-6 {filteredResources.length > 0 ? 'visible' : 'hidden'}">
        {#each resources as image}
            <button
                class="carousel-item me-2 w-32 flex-col {filteredResources.includes(image) ? 'visible' : 'hidden'}"
                on:click={() => resourceSelected(image)}
            >
                <img
                    class="mb-1 h-20 w-32 rounded-lg object-cover"
                    src={cachedOrRealUrl(image.url)}
                    alt={image.displayName}
                    crossorigin="anonymous"
                />
                <span class="line-clamp-1 break-all text-sm text-neutral"
                    >{@html htmlWithHighlightedSearchString(image.displayName, searchQuery)}</span
                >
            </button>
        {/each}
    </div>
{/if}
