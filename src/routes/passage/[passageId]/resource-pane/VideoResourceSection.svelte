<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import {
        filterItemsByKeyMatchingSearchQuery,
        htmlWithHighlightedSearchString,
        shouldSearch,
    } from '$lib/utils/search';
    import { formatSecondsToMins } from '$lib/utils/time';
    import type { ImageOrVideoResource } from './types';
    import { Icon } from 'svelte-awesome';
    import play from 'svelte-awesome/icons/play';

    export let title: string;
    export let resources: ImageOrVideoResource[];
    export let resourceSelected: (video: ImageOrVideoResource) => void;
    export let searchQuery: string;

    let durations: Record<string, number> = {};
    let carousel: HTMLDivElement | null = null;

    $: filteredResources = filterItemsByKeyMatchingSearchQuery(resources, 'displayName', searchQuery);

    // if the user clears the search, scroll the carousel back to the left
    $: !shouldSearch(searchQuery) && carousel?.scrollTo({ left: 0, behavior: 'instant' });

    function setVideoDuration(target: EventTarget | null, video: ImageOrVideoResource) {
        if (target) {
            const videoElement = target as HTMLVideoElement;
            durations[video.url] = videoElement.duration;
        }
    }
</script>

{#if resources.length > 0}
    <div class="text-md pb-2 font-semibold text-base-content {filteredResources.length > 0 ? 'visible' : 'hidden'}">
        {title}
    </div>
    <div bind:this={carousel} class="carousel w-full pb-6 {filteredResources.length > 0 ? 'visible' : 'hidden'}">
        {#each resources as video}
            {@const duration = durations[video.url]}
            <button
                class="carousel-item mr-2 w-32 flex-col {filteredResources.includes(video) ? 'visible' : 'hidden'}"
                on:click={() => resourceSelected(video)}
            >
                <div class="relative mb-1">
                    {#if duration}
                        <div
                            class="absolute bottom-1.5 left-1.5 flex flex-row items-center rounded-lg bg-black bg-opacity-80 p-1 pl-2 pr-1.5
                                text-gray-25"
                        >
                            <Icon data={play} scale={0.5} />
                            <div class="pl-1 text-xs font-semibold">{formatSecondsToMins(duration)}</div>
                        </div>
                    {/if}
                    <!-- svelte-ignore a11y-media-has-caption -->
                    <video
                        class="h-20 w-32 rounded-lg object-cover"
                        on:loadedmetadata={({ target }) => setVideoDuration(target, video)}
                    >
                        <source src={`${cachedOrRealUrl(video.url)}#t=0.001`} type="video/mp4" />
                    </video>
                </div>
                <span class="line-clamp-1 break-all text-sm text-neutral"
                    >{@html htmlWithHighlightedSearchString(video.displayName, searchQuery)}</span
                >
            </button>
        {/each}
    </div>
{/if}
