<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import PlayMediaIcon from '$lib/icons/PlayMediaIcon.svelte';
    import PauseMediaIcon from '$lib/icons/PauseMediaIcon.svelte';
    import { Icon } from 'svelte-awesome';
    import refresh from 'svelte-awesome/icons/refresh';
    import {
        type AudioFileInfo,
        createMultiClipAudioState,
        type MultiClipAudioState,
    } from './AudioPlayer/audio-player-state';
    import { objectEntries, objectValues } from '$lib/utils/typesafe-standard-lib';

    type ClipKey = string;

    const defaultClipKey = 'default' as const;

    // OPTION 1: Pass in a list of files you want to play.
    // Great for when you just need one AudioPlayer to play one or a sequence of clips
    export let files: AudioFileInfo[] | undefined = undefined;

    // OPTION 2: Pass a mapping of MultiClipAudioState, indexed by string keys.
    // Great for when you want one AudioPlayer on a page that can quickly switch between
    // playing different sequences of clips.
    // Example:
    //   bible => MultiClipAudioState{clips: [...]}
    //   guideStep1 => MultiClipAudioState{clips: [...]}
    export let multiClipAudioStates: Record<ClipKey, MultiClipAudioState> = {};

    // Indexes into the multiClipAudioStates to determine the current state to use.
    export let currentClipKey: ClipKey = defaultClipKey;

    let rangeValue = 0;
    let timeDisplay = '';
    let totalTimeDisplay = '';
    let isPlaying = false;
    let allFilesLoaded = false;
    let subscribedKeys: string[] = [];

    $: updateBasedOnKey(currentClipKey);
    $: subscribeToClips(multiClipAudioStates);

    function updateBasedOnKey(key: ClipKey) {
        updateDisplayValues(multiClipAudioStates?.[key]);
    }

    function updateDisplayValues(state: MultiClipAudioState | undefined) {
        if (state) {
            rangeValue = state.rangeValue();
            timeDisplay = state.timeDisplay();
            totalTimeDisplay = state.totalTimeDisplay();
            isPlaying = state.isPlaying();
            allFilesLoaded = state.allFilesLoaded();
        }
    }

    function playOrPause() {
        objectEntries(multiClipAudioStates).forEach(([key, state]) => {
            if (key !== currentClipKey) {
                state.pauseAllClipsAndNotify();
            }
        });
        multiClipAudioStates?.[currentClipKey]?.playOrPause();
    }

    function stopSyncingSeekPosition() {
        multiClipAudioStates?.[currentClipKey]?.stopSyncingSeekPosition();
    }

    function onRangeChange(e: Event) {
        multiClipAudioStates?.[currentClipKey]?.onRangeChange(e);
    }

    function subscribeToClips(clips: Record<ClipKey, MultiClipAudioState>) {
        objectEntries(clips).forEach(([key, clip]) => {
            if (!subscribedKeys.includes(key)) {
                clip.subscribe((state) => {
                    // Only update the component if it's for the current audio player
                    if (key === currentClipKey) {
                        updateDisplayValues(state as unknown as MultiClipAudioState);
                    }
                });
                subscribedKeys = [...subscribedKeys, key];
            }
        });
    }

    onMount(() => {
        if (files) {
            multiClipAudioStates = { [defaultClipKey]: createMultiClipAudioState(files) };
        }
    });

    onDestroy(() => {
        objectValues(multiClipAudioStates).forEach((multiClipAudioState) => multiClipAudioState.onDestroy());
    });
</script>

<div class="flex w-full flex-row items-center justify-center rounded-xl">
    {#if !allFilesLoaded}
        <div />
        <Icon class="h-[20px] w-[20px] grow-0 text-primary" data={refresh} spin />
    {:else}
        <button class="h-[35px] w-[35px] grow-0 cursor-pointer" on:click={playOrPause}>
            {#if isPlaying}
                <PauseMediaIcon />
            {:else}
                <PlayMediaIcon />
            {/if}
        </button>
    {/if}

    <div class="mx-4 grow">
        <input
            type="range"
            class="range-audio range range-primary"
            step="any"
            min="0"
            max="100"
            on:change={onRangeChange}
            on:input={stopSyncingSeekPosition}
            value={rangeValue}
        />
    </div>

    <span class="h-[20px] items-start font-mono text-sm font-medium text-neutral"
        >{timeDisplay} / {totalTimeDisplay}</span
    >
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
