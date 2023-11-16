<script lang="ts">
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { TextResource } from './types';
    import TextResourceSection from './TextResourceSection.svelte';
    import type { ParentResourceNameEnum } from '$lib/types/resource';

    export let parentResourceName: ParentResourceNameEnum | null;
    export let textResourcesByParentResource: Record<ParentResourceNameEnum, TextResource[]>;
    export let resourceSelected: (resource: TextResource) => void;
    export let showParentResourceFullscreen: ((parentResourceName: ParentResourceNameEnum | null) => void) | null =
        null;

    let searchQuery = '';
</script>

{#if parentResourceName}
    <div use:trapFocus class="fixed inset-0 z-[45] flex w-full flex-col bg-primary-content px-4">
        <TextResourceSection
            {parentResourceName}
            resources={textResourcesByParentResource[parentResourceName]}
            bind:searchQuery
            {showParentResourceFullscreen}
            {resourceSelected}
            isFullscreen={true}
        />
    </div>
{/if}
