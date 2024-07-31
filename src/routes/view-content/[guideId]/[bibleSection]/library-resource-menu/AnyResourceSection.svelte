<script lang="ts">
    import {
        SubgroupedTextResourceRegexes,
        ParentResourceType,
        type ResourceContentInfoWithMetadata,
    } from '$lib/types/resource';
    import ImageResourceSection from './ImageResourceSection.svelte';
    import VideoResourceSection from './VideoResourceSection.svelte';
    import NormalTextResourceSection from './NormalTextResourceSection.svelte';
    import type { LibraryResourceGrouping, LibraryResourceSubgrouping } from '../library-resource-loader';
    import { objectKeys } from '$lib/utils/typesafe-standard-lib';
    import SubgroupedTextResourceSection from './SubgroupedTextResourceSection.svelte';

    export let resourceGrouping: LibraryResourceGrouping;
    export let searchQuery: string;
    export let skipClientSideFiltering: boolean;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let subgroupSelected: (subgroup: LibraryResourceSubgrouping) => void;
    export let showResourceGroupingFullscreen:
        | ((resourceGrouping: LibraryResourceGrouping | null) => void)
        | undefined = undefined;
    export let isFullscreen: boolean;

    function showAll() {
        showResourceGroupingFullscreen?.(resourceGrouping);
    }

    function dismissFullscreen() {
        showResourceGroupingFullscreen?.(null);
    }
</script>

{#if resourceGrouping.parentResource.resourceType === ParentResourceType.Images}
    <ImageResourceSection
        {resourceGrouping}
        {resourceSelected}
        {searchQuery}
        {skipClientSideFiltering}
        {isFullscreen}
        {showAll}
        {dismissFullscreen}
    />
{:else if resourceGrouping.parentResource.resourceType === ParentResourceType.Videos}
    <VideoResourceSection
        {resourceGrouping}
        {resourceSelected}
        {searchQuery}
        {skipClientSideFiltering}
        {isFullscreen}
        {showAll}
        {dismissFullscreen}
    />
{:else if objectKeys(SubgroupedTextResourceRegexes).includes(resourceGrouping.parentResource.id)}
    <SubgroupedTextResourceSection
        {resourceGrouping}
        {subgroupSelected}
        {searchQuery}
        {skipClientSideFiltering}
        {isFullscreen}
        {showAll}
        {dismissFullscreen}
    />
{:else}
    <NormalTextResourceSection
        {resourceGrouping}
        {resourceSelected}
        {searchQuery}
        {skipClientSideFiltering}
        {isFullscreen}
        {showAll}
        {dismissFullscreen}
    />
{/if}
