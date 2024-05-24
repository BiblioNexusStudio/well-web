<script lang="ts">
    import SearchInput from '$lib/components/SearchInput.svelte';
    import { Icon } from 'svelte-awesome';
    import type { LibraryResourceGrouping } from '../library-resource-loader';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import { _ as translate } from 'svelte-i18n';
    import { parseSubtitle, parseTitle } from './titles';

    export let resourcesCount: number;
    export let resourceGrouping: LibraryResourceGrouping;
    export let dismissFullscreen: (() => void) | null = null;
    export let searchQuery: string;

    $: title = parseTitle(resourceGrouping.parentResource.displayName);
    $: subtitle = parseSubtitle(resourceGrouping.parentResource.displayName);
</script>

<div class="mx-auto w-full max-w-[65ch]">
    <div class="flex w-full flex-row items-center py-3">
        <button
            class="btn btn-link text-base-500"
            on:click={dismissFullscreen}
            data-app-insights-event-name="fullscreen-close-button-clicked"><Icon data={chevronLeft} /></button
        >
        <div class="flex-grow px-3 text-center text-lg font-semibold text-base-content">
            {title}
            ({subtitle})
        </div>
        <!-- hack to make text centered -->
        <div class="btn btn-link text-base-500 opacity-0"><Icon data={chevronLeft} /></div>
    </div>
    <SearchInput bind:searchQuery />
    <div class="py-4 text-sm text-base-500">
        {#if resourcesCount === 1}
            {$translate('page.passage.resourcePane.resourceCount.singular.value')}
        {:else}
            {$translate('page.passage.resourcePane.resourceCount.plural.value', {
                values: { count: resourcesCount },
            })}
        {/if}
    </div>
</div>
