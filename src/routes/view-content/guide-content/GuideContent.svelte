<script lang="ts">
    import type { MultiClipAudioState } from '$lib/components/AudioPlayer/audio-player-state';
    import { ParentResourceId, type ApiParentResource } from '$lib/types/resource';
    import type { ResourceContentInfoWithFrontendData } from '$lib/utils/data-handlers/resources/resource';
    import FiaContent from './FiaContent.svelte';
    import UwTranslationNotesContent from './UwTranslationNotesContent.svelte';

    export let isShowing: boolean;
    export let currentGuide: ApiParentResource | undefined;
    export let guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined;
    export let multiClipAudioStates: Record<string, MultiClipAudioState>;
    export let audioPlayerKey: string | undefined;
</script>

{#if currentGuide?.id === ParentResourceId.FIA}
    <FiaContent bind:multiClipAudioStates bind:audioPlayerKey {isShowing} {guideResourceInfo} />
{:else if currentGuide?.id === ParentResourceId.UwTranslationNotes}
    <UwTranslationNotesContent bind:audioPlayerKey {isShowing} {guideResourceInfo} />
{/if}
