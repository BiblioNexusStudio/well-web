<script lang="ts">
    import { type ApiParentResource, ParentResourceType, ParentResourceId } from '$lib/types/resource';
    import ImageResourceSection from './ImageResourceSection.svelte';
    import VideoResourceSection from './VideoResourceSection.svelte';
    import TextResourceSection from './TextResourceSection.svelte';
    import type { AnyResource } from './types';
    import { parseSubtitle, parseTitle } from './titles';

    export let parentResource: ApiParentResource;
    export let resources: AnyResource[];
    export let searchQuery: string;
    export let resourceSelected: (resource: AnyResource) => void;
    export let showParentResourceFullscreen: (parentResourceId: ParentResourceId | null) => void;
</script>

{#if parentResource.resourceType === ParentResourceType.Images}
    <ImageResourceSection
        title={parseTitle(parentResource.displayName)}
        subtitle={parseSubtitle(parentResource.displayName)}
        {resources}
        {resourceSelected}
        {searchQuery}
    />
{:else if parentResource.resourceType === ParentResourceType.Videos}
    <VideoResourceSection
        title={parseTitle(parentResource.displayName)}
        subtitle={parseSubtitle(parentResource.displayName)}
        {resources}
        {resourceSelected}
        {searchQuery}
    />
{:else}
    <TextResourceSection
        title={parseTitle(parentResource.displayName)}
        subtitle={parseSubtitle(parentResource.displayName)}
        {resources}
        {resourceSelected}
        {searchQuery}
        isFullscreen={false}
        showParentResourceFullscreen={() => showParentResourceFullscreen(parentResource.id)}
        dismissParentResourceFullscreen={() => showParentResourceFullscreen(null)}
    />
{/if}
