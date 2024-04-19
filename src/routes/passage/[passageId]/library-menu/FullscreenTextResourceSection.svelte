<script lang="ts">
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { AnyResource, TextResource } from './types';
    import TextResourceSection from './TextResourceSection.svelte';
    import { calculateTitle } from './titles';

    export let parentResourceName: string | null;
    export let groupedResources: Record<string, AnyResource[]>;
    export let resourceSelected: (resource: TextResource) => void;
    export let dismissParentResourceFullscreen: () => void;

    $: resources = ((parentResourceName && groupedResources[parentResourceName]) || []) as TextResource[];

    let searchQuery = '';
</script>

{#if parentResourceName}
    <div use:trapFocus class="fixed inset-0 z-[45] flex w-full flex-col bg-primary-content px-4">
        <TextResourceSection
            title={calculateTitle(parentResourceName)}
            subtitle={calculateTitle(parentResourceName, true)}
            {resources}
            bind:searchQuery
            {dismissParentResourceFullscreen}
            {resourceSelected}
            isFullscreen={true}
        />
    </div>
{/if}
