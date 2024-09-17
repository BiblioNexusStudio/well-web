<script lang="ts" generics="T">
    import { htmlWithHighlightedSearchString } from '$lib/utils/search';
    import { _ as translate } from 'svelte-i18n';
    import NoResourcesFound from './NoResourcesFound.svelte';
    import ResourceSectionHeader from './ResourceSectionHeader.svelte';
    import ResourceFullscreenHeader from './ResourceFullscreenHeader.svelte';

    export let filteredItems: T[];
    export let nameKey: keyof T;
    export let title: string;
    export let subtitle: string | null = null;
    export let itemSelected: (item: T) => void;
    export let originalItemsCount: number;
    export let searchQuery: string;
    export let isFullscreen: boolean;
    export let showAll: (() => void) | null = null;
    export let dismissFullscreen: () => void;
    export let alreadyShowingAll: boolean;

    function nameOfItem(item: T) {
        const value = item[nameKey];
        if (typeof value === 'string') {
            return value;
        }
        return null;
    }

    function calculateEventTrackingDimensions(item: T) {
        let dimensions: string[] = [];
        if (item && typeof item === 'object' && 'id' in item) {
            dimensions.push(`resourceContentId,${item.id}`);
        }
        if (item && typeof item === 'object' && 'displayName' in item) {
            dimensions.push(`resourceName,${item.displayName}`);
        }
        return dimensions.length ? dimensions.join(',') : undefined;
    }
</script>

{#if originalItemsCount > 0}
    {#if isFullscreen}
        <ResourceFullscreenHeader
            title={subtitle ? `${title} (${subtitle})` : title}
            resourcesCount={filteredItems.length}
            {dismissFullscreen}
            bind:searchQuery
        />
    {:else}
        <ResourceSectionHeader isVisible={filteredItems.length > 0} {title} {subtitle}>
            {#if !alreadyShowingAll && originalItemsCount > 5}
                <button
                    class="text-sm font-semibold text-base-500"
                    on:click={showAll}
                    data-app-insights-event-name="see-all-resources-clicked"
                    >{$translate('page.passage.resourcePane.seeAll.value', {
                        values: { count: originalItemsCount },
                    })}</button
                >
            {/if}</ResourceSectionHeader
        >
    {/if}

    <div class={isFullscreen ? 'mx-auto w-full max-w-[65ch] overflow-y-scroll pb-4' : 'pb-6'}>
        {#each filteredItems as item}
            <button
                class="mb-4 flex w-full flex-row items-center rounded-full border py-3 ps-4"
                on:click={() => itemSelected(item)}
                data-app-insights-event-name="text-resource-clicked"
                data-app-insights-dimensions={calculateEventTrackingDimensions(item)}
            >
                <div class="flex flex-shrink flex-col items-start">
                    <div class="text-md text-start font-semibold text-blue-title">
                        {@html htmlWithHighlightedSearchString(nameOfItem(item), searchQuery)}
                    </div>
                </div>
            </button>
        {/each}
    </div>
    {#if !isFullscreen && filteredItems.length > 0}
        <hr />
    {/if}
    {#if filteredItems.length === 0 && isFullscreen}
        <NoResourcesFound {searchQuery} />
    {/if}
{/if}
