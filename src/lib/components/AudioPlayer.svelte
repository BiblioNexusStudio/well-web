<script lang="ts">
    import { Howl, type HowlOptions } from 'howler';
    import { onDestroy } from 'svelte';
    import PlayMediaIcon from '$lib/icons/PlayMediaIcon.svelte';
    import PauseMediaIcon from '$lib/icons/PauseMediaIcon.svelte';
    import { Icon } from 'svelte-awesome';
    import refresh from 'svelte-awesome/icons/refresh';
    import type { AudioFileInfo, AudioPlayState } from '$lib/types/audio-player';

    export let files: AudioFileInfo[];

    let playStates = files.map((file) => {
        const hasCustomTime = file.endTime !== null && file.endTime !== undefined;
        const howlOptions: HowlOptions = {
            src: file.url,
            onplay: onplayFactory(file),
            onpause: onpauseFactory(file),
            onend: onendFactory(file),
            onload: onloadFactory(file),
        };
        if (hasCustomTime) {
            howlOptions.sprite = { audioSection: [1000 * file.startTime, 1000 * (file.endTime! - file.startTime)] };
        }
        return {
            currentTimeInFile: file.startTime,
            isPlaying: false,
            playId: null,
            totalTime: null,
            loading: true,
            hasCustomTime,
            sound: new Howl(howlOptions),
        } as AudioPlayState;
    });

    $: allFilesLoaded = playStates.every(({ loading }) => !loading);

    let currentFileIndex = 0;
    let currentTimer: ReturnType<typeof setInterval> | null;

    /** Bind to this when you have multiple players on a single page. It will
     * call pauseAudioIfOtherSourcePlaying when any bound activePlayId changes,
     * preventing multiple audio sources from playing simultaneously.
     */
    export let activePlayId: number | undefined = undefined;
    const pauseAudioIfOtherSourcePlaying = (activePlayId: number | undefined) => {
        if (
            playStates.some(({ playId, sound }) => playId !== null && activePlayId !== playId && sound.playing(playId))
        ) {
            pauseAll();
        }
    };
    $: pauseAudioIfOtherSourcePlaying(activePlayId);

    function indexFromFile(file: AudioFileInfo) {
        return files.indexOf(file);
    }

    function pauseAll() {
        playStates.forEach((state, index) => {
            playStates[index].isPlaying = false;
            if (state.playId !== null && state.sound.playing(state.playId)) {
                state.sound.pause(state.playId);
            }
        });
    }

    function startCurrentTimer() {
        if (currentTimer) return;
        currentTimer = setInterval(() => {
            const currentPlayId = playStates[currentFileIndex].playId;
            if (currentPlayId !== null) {
                playStates[currentFileIndex].currentTimeInFile = playStates[currentFileIndex].sound.seek(
                    currentPlayId
                ) as number;
            }
        }, 50);
    }

    function stopCurrentTimer() {
        if (!currentTimer) return;
        clearInterval(currentTimer);
        currentTimer = null;
    }

    function onplayFactory(file: AudioFileInfo) {
        return (id: number) => {
            playStates[indexFromFile(file)].isPlaying = true;
            startCurrentTimer();
            activePlayId = id;
        };
    }

    function onpauseFactory(file: AudioFileInfo) {
        return () => {
            playStates[indexFromFile(file)].isPlaying = false;
            stopCurrentTimer();
        };
    }

    function onendFactory(file: AudioFileInfo) {
        return () => {
            playStates[indexFromFile(file)].isPlaying = false;
            if (files[indexFromFile(file) + 1]) {
                currentFileIndex = indexFromFile(file) + 1;
                playStates[currentFileIndex].currentTimeInFile = files[currentFileIndex].startTime;
                playCurrent();
            } else {
                stopCurrentTimer();
            }
        };
    }

    function onloadFactory(file: AudioFileInfo) {
        return () => {
            playStates[indexFromFile(file)].loading = false;
            playStates[indexFromFile(file)].totalTime = playStates[indexFromFile(file)].hasCustomTime
                ? file.endTime! - file.startTime
                : playStates[indexFromFile(file)].sound.duration();
        };
    }

    function playCurrent() {
        if (playStates[currentFileIndex].isPlaying) return;
        let playId = playStates[currentFileIndex].playId;
        const currentTime = playStates[currentFileIndex].currentTimeInFile;

        if (playId !== null) {
            playStates[currentFileIndex].sound.play(playId);
        } else if (playStates[currentFileIndex].hasCustomTime) {
            playId = playStates[currentFileIndex].sound.play('audioSection');
            playStates[currentFileIndex].playId = playId;
        } else {
            playId = playStates[currentFileIndex].sound.play();
            playStates[currentFileIndex].playId = playId;
        }
        playStates[currentFileIndex].sound.seek(currentTime, playId);
    }

    function formatTime(totalSeconds: number) {
        totalSeconds = Math.floor(totalSeconds);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    let totalDuration = 0;
    let currentDuration = 0;
    let rangeValue = 0;
    let timeDisplayValue = '00:00';

    function updateDurationAndRange(playStates: AudioPlayState[]) {
        totalDuration = playStates.reduce((acc, state) => {
            return acc + (state.totalTime || 0);
        }, 0);
        currentDuration =
            playStates.slice(0, currentFileIndex).reduce((acc, state) => {
                return acc + (state.totalTime || 0);
            }, 0) +
            (playStates[currentFileIndex].currentTimeInFile || 0) -
            (playStates[currentFileIndex].hasCustomTime ? files[currentFileIndex].startTime : 0);
        rangeValue = 100 * (currentDuration / totalDuration);
        timeDisplayValue = formatTime(currentDuration);
    }

    $: updateDurationAndRange(playStates);

    function onRangeChange(e: Event) {
        stopCurrentTimer();
        const value = (e.target as HTMLInputElement).value;
        const newTime = (parseInt(value) / 100) * totalDuration;
        let offset = 0;
        let newFileIndex = 0;
        const isPlaying = playStates[currentFileIndex].isPlaying;

        for (; newFileIndex < playStates.length; newFileIndex++) {
            const fileTotalTime = playStates[newFileIndex].totalTime || 0;
            if (offset + fileTotalTime >= newTime) break;
            offset += fileTotalTime;
        }

        if (newFileIndex !== currentFileIndex) {
            currentFileIndex = newFileIndex;
        }

        const startTime = playStates[currentFileIndex].hasCustomTime ? files[currentFileIndex].startTime : 0;
        playStates[currentFileIndex].currentTimeInFile = newTime - offset + startTime;

        if (isPlaying) {
            pauseAll();
            playCurrent();
        }
    }

    function onPlayPauseClick() {
        playStates[currentFileIndex].isPlaying ? pauseAll() : playCurrent();
    }

    onDestroy(() => {
        playStates.forEach((state) => {
            state.sound.unload();
        });
    });
</script>

<div class="relative w-full flex flex-row justify-center items-center rounded-xl">
    {#if !allFilesLoaded}
        <div />
        <Icon class="grow-0 w-[20px] h-[20px] text-primary" data={refresh} spin />
    {:else}
        <button class="grow-0 w-[20px] h-[20px] cursor-pointer" on:click={onPlayPauseClick}>
            {#if playStates[currentFileIndex].isPlaying}
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
            on:input={stopCurrentTimer}
            value={rangeValue}
        />
    </div>

    <span class="items-start text-sm font-medium text-neutral h-[20px] font-mono">{timeDisplayValue}</span>
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
