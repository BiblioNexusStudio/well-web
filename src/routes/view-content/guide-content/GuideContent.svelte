<script lang="ts">
    import type { MultiClipAudioState } from '$lib/components/AudioPlayer/audio-player-state';
    import { ParentResourceId, type ApiParentResource, type ResourceContentInfo } from '$lib/types/resource';
    import FiaContent from './FiaContent.svelte';

    export let isShowing: boolean;
    export let currentGuide: ApiParentResource | undefined;
    export let guideResourceInfo: ResourceContentInfo[] | undefined;
    export let multiClipAudioStates: Record<string, MultiClipAudioState>;
    export let audioPlayerKey: string | undefined;
</script>

{#if currentGuide?.id === ParentResourceId.FIA}
    <FiaContent bind:multiClipAudioStates bind:audioPlayerKey {isShowing} {guideResourceInfo} />
{/if}
