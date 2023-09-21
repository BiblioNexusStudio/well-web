<script lang="ts">
    import { onDestroy } from 'svelte';
    import PlayMediaIcon from '$lib/icons/PlayMediaIcon.svelte';
    import PauseMediaIcon from '$lib/icons/PauseMediaIcon.svelte';
    import { Icon } from 'svelte-awesome';
    import refresh from 'svelte-awesome/icons/refresh';
    import { type AudioFileInfo, createAudioPlayerStateStore } from './AudioPlayer/audio-player-state';

    export let files: AudioFileInfo[];
    export let activePlayId: number | undefined = undefined;
    let rangeValue = 0;
    let timeDisplay = '';
    let isPlaying = false;
    let allFilesLoaded = false;

    let audioPlayerState = createAudioPlayerStateStore(files, (id) => (activePlayId = id));

    audioPlayerState.subscribe((state) => {
        rangeValue = state.rangeValue;
        timeDisplay = state.timeDisplay;
        isPlaying = state.isPlaying;
        allFilesLoaded = state.allFilesLoaded;
    });

    /** This is for when you have multiple players on a single page. It will
     * call pauseAudioIfOtherSourcePlaying when any bound activePlayId changes,
     * preventing multiple audio sources from playing simultaneously.
     */
    $: audioPlayerState.pauseAudioIfOtherSourcePlaying(activePlayId);

    onDestroy(() => {
        audioPlayerState.onDestroy();
    });
</script>

<div class="relative w-full flex flex-row justify-center items-center rounded-xl">
    {#if !allFilesLoaded}
        <div />
        <Icon class="grow-0 w-[20px] h-[20px] text-primary" data={refresh} spin />
    {:else}
        <button class="grow-0 w-[20px] h-[20px] cursor-pointer" on:click={audioPlayerState.playOrPause}>
            {#if isPlaying}
                <PauseMediaIcon />
            {:else}
                <PlayMediaIcon />
            {/if}
        </button>
    {/if}

    <div class="w-full mx-4">
        <input
            type="range"
            id="song-percentage-played"
            class="range range-audio range-primary"
            step="any"
            min="0"
            max="100"
            on:change={audioPlayerState.onRangeChange}
            on:input={audioPlayerState.stopSyncingSeekPosition}
            value={rangeValue}
        />
    </div>

    <span class="items-start text-sm font-medium text-neutral h-[20px] font-mono">{timeDisplay}</span>
</div>

<style>
    .range-audio {
        height: 0.75rem;
    }
    .range-audio::-webkit-slider-runnable-track {
        height: 0.75rem;
    }
    .range-audio::-moz-range-track {
        height: 0.75rem;
    }
    .range-audio::-webkit-slider-thumb {
        height: 0.75rem;
        width: 0.75rem;
        --filler-offset: 0.4rem;
    }
    .range-audio::-moz-range-thumb {
        height: 0.75rem;
        width: 0.75rem;
        --filler-offset: 0.4rem;
    }
</style>
