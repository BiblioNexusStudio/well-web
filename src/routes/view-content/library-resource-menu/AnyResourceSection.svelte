<script lang="ts">
    import { ParentResourceType, type ResourceContentInfoWithMetadata } from '$lib/types/resource';
    import ImageResourceSection from './ImageResourceSection.svelte';
    import VideoResourceSection from './VideoResourceSection.svelte';
    import TextResourceSection from './TextResourceSection.svelte';
    import type { LibraryResourceGrouping } from '../library-resource-loader';

    export let resourceGrouping: LibraryResourceGrouping;
    export let searchQuery: string;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
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
        {isFullscreen}
        {showAll}
        {dismissFullscreen}
    />
{:else if resourceGrouping.parentResource.resourceType === ParentResourceType.Videos}
    <VideoResourceSection
        {resourceGrouping}
        {resourceSelected}
        {searchQuery}
        {isFullscreen}
        {showAll}
        {dismissFullscreen}
    />
{:else}
    <TextResourceSection
        {resourceGrouping}
        {resourceSelected}
        {searchQuery}
        {isFullscreen}
        {showAll}
        {dismissFullscreen}
    />
{/if}
