<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import PlayMediaIcon from '$lib/icons/PlayMediaIcon.svelte';
    import PauseMediaIcon from '$lib/icons/PauseMediaIcon.svelte';
    import { Icon } from 'svelte-awesome';
    import refresh from 'svelte-awesome/icons/refresh';
    import {
        type AudioFileInfo,
        createAudioPlayerStateStore,
        type AudioPlayerStateStore,
    } from './AudioPlayer/audio-player-state';
    import { objectEntries, objectValues } from '$lib/utils/typesafe-standard-lib';

    export let files: AudioFileInfo[] | undefined = undefined;

    export let audioPlayerStateStores: Record<string, AudioPlayerStateStore> = {};
    export let currentStateStoreKey = 'default';

    let rangeValue = 0;
    let timeDisplay = '';
    let isPlaying = false;
    let allFilesLoaded = false;

    $: updateBasedOnKey(currentStateStoreKey);

    function updateBasedOnKey(key: string) {
        const currentStateStore = audioPlayerStateStores?.[key];
        if (currentStateStore) {
            rangeValue = currentStateStore.rangeValue();
            timeDisplay = currentStateStore.timeDisplay();
            isPlaying = currentStateStore.isPlaying();
            allFilesLoaded = currentStateStore.allFilesLoaded();
        }
    }

    function playOrPause() {
        objectEntries(audioPlayerStateStores).forEach(([key, store]) => {
            if (key !== currentStateStoreKey) {
                store.pauseAllFilesAndNotify();
            }
        });
        audioPlayerStateStores?.[currentStateStoreKey]?.playOrPause();
    }

    function stopSyncingSeekPosition() {
        audioPlayerStateStores?.[currentStateStoreKey]?.stopSyncingSeekPosition();
    }

    function onRangeChange(e: Event) {
        audioPlayerStateStores?.[currentStateStoreKey]?.onRangeChange(e);
    }

    onMount(() => {
        if (files) {
            audioPlayerStateStores = { default: createAudioPlayerStateStore(files) };
        }

        objectEntries(audioPlayerStateStores).forEach(([key, audioPlayerStateStore]) => {
            audioPlayerStateStore.subscribe((state) => {
                // Only update the component if it's for the current audio player
                if (key === currentStateStoreKey) {
                    rangeValue = state.rangeValue();
                    timeDisplay = state.timeDisplay();
                    isPlaying = state.isPlaying();
                    allFilesLoaded = state.allFilesLoaded();
                }
            });
        });
    });

    onDestroy(() => {
        objectValues(audioPlayerStateStores).forEach((audioPlayerStateStore) => audioPlayerStateStore.onDestroy());
    });
</script>

<div class="w-full flex flex-row justify-center items-center rounded-xl">
    {#if !allFilesLoaded}
        <div />
        <Icon class="grow-0 w-[20px] h-[20px] text-primary" data={refresh} spin />
    {:else}
        <button class="grow-0 w-[20px] h-[20px] cursor-pointer" on:click={playOrPause}>
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
            on:change={onRangeChange}
            on:input={stopSyncingSeekPosition}
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
