<script lang="ts">
    import { ParentResourceComplexityLevel, type ApiParentResource, ParentResourceType } from '$lib/types/resource';
    import ImageResourceSection from './ImageResourceSection.svelte';
    import VideoResourceSection from './VideoResourceSection.svelte';
    import TextResourceSection from './TextResourceSection.svelte';
    import type { AnyResource, ResourcePaneTab } from './types';
    import { calculateTitle } from './titles';

    export let activeTab: ResourcePaneTab;
    export let parentResource: ApiParentResource;
    export let resources: AnyResource[];
    export let searchQuery: string;
    export let resourceSelected: (resource: AnyResource) => void;
    export let showParentResourceFullscreen: (parentResourceName: string | null) => void;

    $: shouldShowForTab =
        activeTab === 'searching' ||
        (activeTab === 'basic' && parentResource.complexityLevel === ParentResourceComplexityLevel.Basic) ||
        (activeTab === 'advanced' && parentResource.complexityLevel === ParentResourceComplexityLevel.Advanced);
</script>

{#if shouldShowForTab}
    {#if parentResource.resourceType === ParentResourceType.Images}
        <ImageResourceSection
            title={calculateTitle(parentResource.shortName)}
            {resources}
            {resourceSelected}
            {searchQuery}
        />
    {:else if parentResource.resourceType === ParentResourceType.Videos}
        <VideoResourceSection
            title={calculateTitle(parentResource.shortName)}
            {resources}
            {resourceSelected}
            {searchQuery}
        />
    {:else}
        <TextResourceSection
            title={calculateTitle(parentResource.shortName)}
            {resources}
            {resourceSelected}
            {searchQuery}
            isFullscreen={false}
            showParentResourceFullscreen={() => showParentResourceFullscreen(parentResource.shortName)}
            dismissParentResourceFullscreen={() => showParentResourceFullscreen(null)}
        />
    {/if}
{/if}
