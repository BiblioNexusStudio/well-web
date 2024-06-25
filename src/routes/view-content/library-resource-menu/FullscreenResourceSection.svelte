<script lang="ts">
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { ResourceContentInfoWithMetadata } from '$lib/types/resource';
    import AnyResourceSection from './AnyResourceSection.svelte';
    import type { LibraryResourceGrouping, LibraryResourceSubgrouping } from '../library-resource-loader';

    export let currentFullscreenResourceGrouping: LibraryResourceGrouping | null;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let subgroupSelected: (subgroup: LibraryResourceSubgrouping) => void;
    export let showResourceGroupingFullscreen: (resourceGrouping: LibraryResourceGrouping | null) => void;

    let searchQuery = '';
</script>

{#if currentFullscreenResourceGrouping}
    <div use:trapFocus class="fixed inset-0 z-[45] flex w-full flex-col bg-primary-content px-4">
        <AnyResourceSection
            resourceGrouping={currentFullscreenResourceGrouping}
            isFullscreen={true}
            skipClientSideFiltering={false}
            {searchQuery}
            {subgroupSelected}
            {resourceSelected}
            {showResourceGroupingFullscreen}
        />
    </div>
{/if}
