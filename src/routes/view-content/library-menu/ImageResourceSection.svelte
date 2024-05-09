<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import {
        filterItemsByKeyMatchingSearchQuery,
        htmlWithHighlightedSearchString,
        shouldSearch,
    } from '$lib/utils/search';
    import ResourceSectionHeader from './ResourceSectionHeader.svelte';
    import type { AnyResource, ImageOrVideoResource } from './types';

    export let title: string | null;
    export let subtitle: string | null;
    export let resources: AnyResource[];
    export let resourceSelected: (image: ImageOrVideoResource) => void;
    export let searchQuery: string;

    let carousel: HTMLDivElement | null = null;

    $: imageResources = resources.filter(
        (resource) => 'type' in resource && resource.type === 'image'
    ) as ImageOrVideoResource[];

    $: filteredResources = filterItemsByKeyMatchingSearchQuery(imageResources, 'displayName', searchQuery);

    // if the user clears the search, scroll the carousel back to the left
    $: !shouldSearch(searchQuery) && carousel?.scrollTo({ left: 0, behavior: 'instant' });
</script>

{#if imageResources.length > 0}
    <ResourceSectionHeader isVisible={filteredResources.length > 0} {title} {subtitle} />
    <div bind:this={carousel} class="carousel w-full pb-6 {filteredResources.length > 0 ? 'visible' : 'hidden'}">
        {#each imageResources as image}
            <button
                class="carousel-item me-8 w-32 flex-col {filteredResources.includes(image) ? 'visible' : 'hidden'}"
                on:click={() => resourceSelected(image)}
            >
                <img
                    class="mb-1 h-20 w-32 rounded-lg object-cover"
                    src={cachedOrRealUrl(image.url)}
                    alt={image.displayName}
                    crossorigin="anonymous"
                />
                <span class="text-md line-clamp-1 break-all font-semibold text-blue-title"
                    >{@html htmlWithHighlightedSearchString(image.displayName, searchQuery)}</span
                >
            </button>
        {/each}
    </div>
    {#if filteredResources.length > 0}
        <hr />
    {/if}
{/if}
