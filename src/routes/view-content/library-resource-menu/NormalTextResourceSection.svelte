<script lang="ts">
    import { filterItemsByKeyMatchingSearchQuery, shouldSearch } from '$lib/utils/search';
    import type { LibraryResourceGrouping } from '../library-resource-loader';
    import type { ResourceContentInfoWithMetadata } from '$lib/types/resource';
    import GenericTextResourceSection from './GenericTextResourceSection.svelte';
    import { parseSubtitle, parseTitle } from './titles';

    export let resourceGrouping: LibraryResourceGrouping;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let searchQuery: string;
    export let skipClientSideFiltering: boolean;
    export let isFullscreen: boolean;
    export let showAll: (() => void) | null = null;
    export let dismissFullscreen: () => void;

    $: shouldFilter = shouldSearch(searchQuery) && !skipClientSideFiltering;

    // resources filtered to:
    // - searched results if searching OR
    // - all resources if fullscreen OR
    // - first 5 resources
    $: showingResources = shouldFilter
        ? filterItemsByKeyMatchingSearchQuery(resourceGrouping.resources, 'displayName', searchQuery)
        : isFullscreen
        ? resourceGrouping.resources
        : resourceGrouping.resources.slice(0, 5);
</script>

<GenericTextResourceSection
    filteredItems={showingResources}
    nameKey="displayName"
    alreadyShowingAll={shouldFilter}
    originalItemsCount={resourceGrouping.resources.length}
    {isFullscreen}
    {showAll}
    {dismissFullscreen}
    bind:searchQuery
    itemSelected={resourceSelected}
    title={parseTitle(resourceGrouping.parentResource.displayName)}
    subtitle={parseSubtitle(resourceGrouping.parentResource.displayName)}
/>
