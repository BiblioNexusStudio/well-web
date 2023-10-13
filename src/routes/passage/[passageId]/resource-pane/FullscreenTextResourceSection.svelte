<script lang="ts">
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { TextResource } from './types';
    import TextResourceSection from './TextResourceSection.svelte';
    import type { ResourceTypeEnum } from '$lib/types/resource';

    export let type: ResourceTypeEnum | null;
    export let textResourcesByType: Record<ResourceTypeEnum, TextResource[]>;
    export let resourceSelected: (resource: TextResource) => void;
    export let showTypeFullscreen: ((type: ResourceTypeEnum | null) => void) | null = null;

    let searchQuery = '';
</script>

{#if type}
    <div use:trapFocus class="fixed inset-0 z-[45] flex w-full flex-col bg-primary-content px-4">
        <TextResourceSection
            {type}
            resources={textResourcesByType[type]}
            bind:searchQuery
            {showTypeFullscreen}
            {resourceSelected}
            isFullscreen={true}
        />
    </div>
{/if}
