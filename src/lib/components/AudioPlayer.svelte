<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import PlayMediaIcon from '$lib/icons/PlayMediaIcon.svelte';
    import PauseMediaIcon from '$lib/icons/PauseMediaIcon.svelte';
    import { Howl } from 'howler';
    import type { HowlOptions } from 'howler';
    import refresh from 'svelte-awesome/icons/refresh';
    import { Icon } from 'svelte-awesome';
    import { onDestroy } from 'svelte';
    import type { AudioFileInfo, AudioPlayState } from '$lib/types/audio-player';
    type Timer = ReturnType<typeof setInterval>;

    export let file: AudioFileInfo;
    export let activePlayId: number | undefined = undefined;

    const hasCustomTime = file.endTime !== null && file.endTime !== undefined;

    const howlOptions: HowlOptions = {
        src: cachedOrRealUrl(file.url),
        onplay: (id) => {
            playState.isPlaying = true;
            playState.playId = id;
            timer = setInterval(() => {
                playState.currentTime = playState.sound.seek(id) as number;
                if (!playState.sound.playing(id)) clearInterval(timer);
            }, 50);
            activePlayId = id;
        },
        onpause: () => (playState.isPlaying = false),
        onend: () => (playState.isPlaying = false),
        onload: () => {
            playState.loading = false;
            playState.totalTime = hasCustomTime
                ? file.endTime! - file.startTime
                : playState.sound.duration(playState.playId!);
        },
    };

    if (hasCustomTime) {
        howlOptions.sprite = { audioSection: [1000 * file.startTime, 1000 * (file.endTime! - file.startTime)] };
    }

    let playState: AudioPlayState = {
        currentTime: file.startTime,
        isPlaying: false,
        playId: null,
        totalTime: null,
        loading: true,
        sound: new Howl(howlOptions),
    };

    const pauseAudioIfOtherSourcePlaying = (activePlayId: number | undefined) => {
        if (
            playState.playId !== null &&
            activePlayId !== playState.playId &&
            playState.sound.playing(playState.playId)
        ) {
            playState.sound.pause(playState.playId);
        }
    };
    $: pauseAudioIfOtherSourcePlaying(activePlayId);

    let timer: Timer;
    $: currentTimeOffset = playState.currentTime - file.startTime;
    $: rangeValue = playState.totalTime === null ? 0 : 100 * (currentTimeOffset / playState.totalTime);
    $: timeDisplayValue = `${formatTime(currentTimeOffset)}`;

    const onRangeChange = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        playState.currentTime = file.startTime + (parseInt(value) / 100) * (playState.totalTime || 0);

        if (playState.playId !== null) {
            playState.sound.pause(playState.playId);
            playState.sound.seek(playState.currentTime, playState.playId);
            playState.sound.play(playState.playId);
        }
    };

    const onRangeInput = () => clearInterval(timer);

    const onPlayPauseClick = () => {
        if (playState.isPlaying) return playState.sound.pause(playState.playId!);
        if (playState.playId !== null) return playState.sound.play(playState.playId);

        const sprite = hasCustomTime ? 'audioSection' : undefined;
        const id = playState.sound.play(sprite);
        playState.sound.seek(playState.currentTime, id);
        playState.playId = id;
    };

    const formatTime = (totalSeconds: number) => {
        totalSeconds = Math.floor(totalSeconds);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    onDestroy(() => playState.sound.unload());
</script>

<div class="relative w-full flex flex-row justify-center items-center rounded-xl">
    {#if playState.loading}
        <div />
        <Icon class="grow-0 w-[20px] h-[20px] text-primary" data={refresh} spin />
    {:else}
        <button class="grow-0 w-[20px] h-[20px] cursor-pointer" on:click={onPlayPauseClick}>
            {#if playState.isPlaying}
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
            on:input={onRangeInput}
            value={rangeValue}
        />
    </div>

    <span class="items-start text-sm font-sans font-medium text-neutral h-[20px]">{timeDisplayValue}</span>
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
