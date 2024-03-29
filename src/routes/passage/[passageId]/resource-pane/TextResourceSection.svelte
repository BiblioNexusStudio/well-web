<script lang="ts">
    import arrowRight from 'svelte-awesome/icons/arrowRight';
    import type { AnyResource, TextResource } from './types';
    import { Icon } from 'svelte-awesome';
    import {
        filterItemsByKeyMatchingSearchQuery,
        htmlWithHighlightedSearchString,
        shouldSearch,
    } from '$lib/utils/search';
    import { _ as translate } from 'svelte-i18n';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import NoResourcesFound from './NoResourcesFound.svelte';

    export let title: string | null;
    export let resources: AnyResource[];
    export let resourceSelected: (resource: TextResource) => void;
    export let searchQuery: string;
    export let isFullscreen: boolean;
    export let showParentResourceFullscreen: (() => void) | null = null;
    export let dismissParentResourceFullscreen: (() => void) | null = null;

    $: textResources = resources.filter((resource) => !('type' in resource)) as TextResource[];

    // resources filtered to:
    // - searched results if searching OR
    // - all resources if fullscreen OR
    // - first 5 resources
    $: showingResources = shouldSearch(searchQuery)
        ? filterItemsByKeyMatchingSearchQuery(textResources, 'displayName', searchQuery)
        : isFullscreen
        ? textResources
        : textResources.slice(0, 5);
</script>

{#if textResources.length > 0}
    {#if isFullscreen}
        <div class="mx-auto w-full max-w-[65ch]">
            <div class="flex w-full flex-row items-center py-3">
                <button class="btn btn-link text-base-500" on:click={dismissParentResourceFullscreen}
                    ><Icon data={chevronLeft} /></button
                >
                <div class="flex-grow px-3 text-center text-lg font-semibold text-base-content">{title}</div>
                <!-- hack to make text centered -->
                <div class="btn btn-link text-base-500 opacity-0"><Icon data={chevronLeft} /></div>
            </div>
            <SearchInput bind:searchQuery />
            <div class="py-4 text-sm text-base-500">
                {#if showingResources.length === 1}
                    {$translate('page.passage.resourcePane.resourceCount.singular.value')}
                {:else}
                    {$translate('page.passage.resourcePane.resourceCount.plural.value', {
                        values: { count: showingResources.length },
                    })}
                {/if}
            </div>
        </div>
    {:else}
        <div class="flex pb-2 {showingResources.length > 0 ? 'visible' : 'hidden'}">
            <div class="text-md font-semibold text-base-content">{title}</div>
            <div class="flex-grow"></div>
            {#if !shouldSearch(searchQuery) && textResources.length > 5}
                <button class="text-sm font-semibold text-base-500" on:click={showParentResourceFullscreen}
                    >{$translate('page.passage.resourcePane.seeAll.value', {
                        values: { count: textResources.length },
                    })}</button
                >
            {/if}
        </div>
    {/if}

    <div class={isFullscreen ? 'mx-auto w-full max-w-[65ch] overflow-y-scroll pb-4' : 'pb-6'}>
        {#each showingResources as entry}
            <button class="flex w-full flex-row items-center py-3" on:click={() => resourceSelected(entry)}>
                <div class="flex flex-shrink flex-col items-start">
                    <div class="text-start text-sm font-medium text-base-content">
                        {@html htmlWithHighlightedSearchString(entry.displayName, searchQuery)}
                    </div>
                    <div class="line-clamp-1 break-all text-start text-sm text-neutral">{entry.preview}</div>
                </div>
                <div class="flex-shrink-0 pe-3 ps-9">
                    <Icon class="text-neutral" data={arrowRight} />
                </div>
            </button>
        {/each}
    </div>
    {#if showingResources.length === 0 && isFullscreen}
        <NoResourcesFound {searchQuery} />
    {/if}
{/if}
