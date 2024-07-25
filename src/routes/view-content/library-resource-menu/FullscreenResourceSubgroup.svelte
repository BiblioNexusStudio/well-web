<script lang="ts">
    import { filterItemsByKeyMatchingSearchQuery, shouldSearch } from '$lib/utils/search';
    import type { LibraryResourceSubgrouping } from '../library-resource-loader';
    import type { ResourceContentInfoWithMetadata } from '$lib/types/resource';
    import { trapFocus } from '$lib/utils/trap-focus';
    import GenericTextResourceSection from './GenericTextResourceSection.svelte';

    export let currentFullscreenResourceSubgrouping: LibraryResourceSubgrouping | null;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let dismissFullscreen: () => void;

    let searchQuery = '';

    $: shouldFilter = shouldSearch(searchQuery);

    // resources filtered to:
    // - searched results if searching OR
    // - all resources
    $: showingResources =
        (shouldFilter
            ? filterItemsByKeyMatchingSearchQuery(
                  currentFullscreenResourceSubgrouping?.resources ?? [],
                  'displayName',
                  searchQuery
              )
            : currentFullscreenResourceSubgrouping?.resources) ?? [];
</script>

{#if currentFullscreenResourceSubgrouping}
    <div use:trapFocus class="fixed inset-0 bottom-20 z-[45] flex w-full flex-col bg-primary-content px-4">
        <GenericTextResourceSection
            filteredItems={showingResources}
            nameKey="displayName"
            alreadyShowingAll={shouldFilter}
            originalItemsCount={currentFullscreenResourceSubgrouping.resources.length}
            isFullscreen={true}
            {dismissFullscreen}
            bind:searchQuery
            itemSelected={resourceSelected}
            title={currentFullscreenResourceSubgrouping.displayName}
        />
    </div>
{/if}
