<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import {
        filterItemsByKeyMatchingSearchQuery,
        htmlWithHighlightedSearchString,
        shouldSearch,
    } from '$lib/utils/search';
    import { formatSecondsToMins } from '$lib/utils/time';
    import type { AnyResource, ImageOrVideoResource } from './types';
    import { Icon } from 'svelte-awesome';
    import play from 'svelte-awesome/icons/play';
    import { _ as translate } from 'svelte-i18n';

    export let title: string | null;
    export let resources: AnyResource[];
    export let resourceSelected: (video: ImageOrVideoResource) => void;
    export let searchQuery: string;

    let carousel: HTMLDivElement | null = null;

    $: videoResources = resources.filter(
        (resource) => 'type' in resource && resource.type === 'video'
    ) as ImageOrVideoResource[];

    $: filteredResources = filterItemsByKeyMatchingSearchQuery(videoResources, 'displayName', searchQuery);

    // if the user clears the search, scroll the carousel back to the left
    $: !shouldSearch(searchQuery) && carousel?.scrollTo({ left: 0, behavior: 'instant' });
</script>

{#if videoResources.length > 0}
    <div class="text-md pb-2 font-semibold text-base-content {filteredResources.length > 0 ? 'visible' : 'hidden'}">
        {title}
    </div>
    <div bind:this={carousel} class="carousel w-full pb-6 {filteredResources.length > 0 ? 'visible' : 'hidden'}">
        {#each videoResources as video}
            <button
                class="carousel-item me-2 w-32 flex-col {filteredResources.includes(video) ? 'visible' : 'hidden'}"
                on:click={() => resourceSelected(video)}
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
                    >{@html htmlWithHighlightedSearchString(video.displayName, searchQuery)}</span
                >
            </button>
        {/each}
    </div>
{/if}
