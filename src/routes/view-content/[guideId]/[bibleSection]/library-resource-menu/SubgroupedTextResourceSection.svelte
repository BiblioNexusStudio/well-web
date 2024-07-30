<script lang="ts">
    import { filterItemsByKeyMatchingSearchQuery, shouldSearch } from '$lib/utils/search';
    import type { LibraryResourceGrouping, LibraryResourceSubgrouping } from '../library-resource-loader';
    import { SubgroupedTextResourceRegexes } from '$lib/types/resource';
    import { groupBy } from '$lib/utils/array';
    import { objectEntries } from '$lib/utils/typesafe-standard-lib';
    import { parseSubtitle, parseTitle } from './titles';
    import GenericTextResourceSection from './GenericTextResourceSection.svelte';

    export let resourceGrouping: LibraryResourceGrouping;
    export let subgroupSelected: (subgroup: LibraryResourceSubgrouping) => void;
    export let searchQuery: string;
    export let skipClientSideFiltering: boolean;
    export let isFullscreen: boolean;
    export let showAll: (() => void) | null;
    export let dismissFullscreen: () => void;

    $: groupingRegex = SubgroupedTextResourceRegexes[resourceGrouping.parentResource.id]!;
    $: subgroupedResources = objectEntries(
        groupBy(
            resourceGrouping.resources,
            (r) => r.displayName?.match(groupingRegex)?.[1] ?? '',
            (r) => r
        )
    )
        .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
        .map(([displayName, resources]) => ({ displayName, resources }));

    $: shouldFilter = shouldSearch(searchQuery) && !skipClientSideFiltering;

    // resource groups filtered to:
    // - searched results if searching OR
    // - all groups if fullscreen OR
    // - first 5 groups
    $: showingGroups = shouldFilter
        ? filterItemsByKeyMatchingSearchQuery(subgroupedResources, 'displayName', searchQuery)
        : isFullscreen
        ? subgroupedResources
        : subgroupedResources.slice(0, 5);
</script>

<GenericTextResourceSection
    filteredItems={showingGroups}
    nameKey="displayName"
    alreadyShowingAll={shouldFilter}
    originalItemsCount={subgroupedResources.length}
    {isFullscreen}
    {showAll}
    {dismissFullscreen}
    bind:searchQuery
    itemSelected={subgroupSelected}
    title={parseTitle(resourceGrouping.parentResource.displayName)}
    subtitle={parseSubtitle(resourceGrouping.parentResource.displayName)}
/>
