<script lang="ts">
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { AnyResource, TextResource } from './types';
    import TextResourceSection from './TextResourceSection.svelte';
    import { parseSubtitle, parseTitle } from './titles';
    import type { ApiParentResource, ParentResourceId } from '$lib/types/resource';

    export let parentResourceIdToInfoMap: Record<ParentResourceId, ApiParentResource | undefined>;
    export let parentResourceId: ParentResourceId | null;
    export let groupedResources: Record<string, AnyResource[]>;
    export let resourceSelected: (resource: TextResource) => void;
    export let dismissParentResourceFullscreen: () => void;

    $: resources = ((parentResourceId && groupedResources[parentResourceId]) || []) as TextResource[];

    let searchQuery = '';
</script>

{#if parentResourceId}
    <div use:trapFocus class="fixed inset-0 z-[45] flex w-full flex-col bg-primary-content px-4">
        <TextResourceSection
            title={parseTitle(parentResourceIdToInfoMap[parentResourceId]?.displayName)}
            subtitle={parseSubtitle(parentResourceIdToInfoMap[parentResourceId]?.displayName)}
            {resources}
            bind:searchQuery
            {dismissParentResourceFullscreen}
            {resourceSelected}
            isFullscreen={true}
        />
    </div>
{/if}
