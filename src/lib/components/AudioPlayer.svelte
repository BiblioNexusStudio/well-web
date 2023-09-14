<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import PlayMediaIcon from '$lib/icons/PlayMediaIcon.svelte';
    import PauseMediaIcon from '$lib/icons/PauseMediaIcon.svelte';
    import { Howl } from 'howler';
    import type { HowlOptions } from 'howler';
    import refresh from 'svelte-awesome/icons/refresh';
    import { Icon } from 'svelte-awesome';
    import { onDestroy } from 'svelte';
    type Timer = ReturnType<typeof setInterval>;

    export let audioFile: string;
    export let startTime = 0;
    export let endTime: number | null = null;

    /** Bind to this when you have multiple players on a single page. It will
     * call pauseAudioIfOtherSourcePlaying when any bound activePlayId changes,
     * preventing multiple audio sources from playing simultaneously.
     */
    export let activePlayId: number | undefined = undefined;
    const pauseAudioIfOtherSourcePlaying = (activePlayId: number | undefined) => {
        if (playId !== undefined && activePlayId !== playId && sound.playing(playId)) {
            sound.pause(playId);
        }
    };
    $: pauseAudioIfOtherSourcePlaying(activePlayId);

    const hasCustomTime = endTime !== null;
    let playId: number | undefined = undefined;
    let isAudioPlaying = false;
    let currentTime = startTime;
    let totalTime = 0;
    let timer: Timer;
    let loading = true;
    $: currentTimeOffset = currentTime - startTime;
    $: rangeValue = totalTime === 0 ? 0 : 100 * (currentTimeOffset / totalTime);
    $: timeDisplayValue = `${formatTime(currentTimeOffset)}`;

    const howlOptions: HowlOptions = {
        src: cachedOrRealUrl(audioFile),
        onplay: () => {
            isAudioPlaying = true;
            timer = setInterval(() => {
                currentTime = sound.seek(playId);
                if (!sound.playing(playId)) clearInterval(timer);
            }, 50);

            activePlayId = playId;
        },
        onpause: () => {
            isAudioPlaying = false;
        },
        onend: () => {
            isAudioPlaying = false;
        },
        onload: () => {
            loading = false;
            totalTime = hasCustomTime ? endTime! - startTime : sound.duration(playId);
        },
    };

    // If you specify a section, you must play a section.
    if (hasCustomTime) {
        howlOptions.sprite = {
            audioSection: [1000 * startTime, 1000 * (endTime! - startTime)],
        };
    }

    const sound = new Howl(howlOptions);

    const onRangeChange = (event: Event) => {
        const { value } = event.target as HTMLInputElement;
        currentTime = startTime + (parseInt(value) / 100) * totalTime;

        if (playId !== undefined) {
            sound.pause(playId);
            sound.seek(currentTime, playId);
            sound.play(playId);
        }
    };

    const onRangeInput = () => {
        clearInterval(timer);
    };

    const onPlayPauseClick = () => {
        if (isAudioPlaying) {
            sound.pause(playId);
            return;
        }

        if (playId !== undefined) {
            sound.play(playId);
            return;
        }

        if (hasCustomTime) {
            playId = sound.play('audioSection');
        } else {
            playId = sound.play();
        }

        sound.seek(currentTime, playId);
    };

    const formatTime = (totalSeconds: number) => {
        totalSeconds = Math.floor(totalSeconds);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    onDestroy(() => sound.unload());
</script>

<div class="relative w-full flex flex-row justify-center items-center rounded-xl">
    {#if loading}
        <div />
        <Icon class="grow-0 w-[20px] h-[20px] text-primary" data={refresh} spin />
    {:else}
        <button class="grow-0 w-[20px] h-[20px] cursor-pointer" on:click={onPlayPauseClick}>
            {#if isAudioPlaying}
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
            bind:value={rangeValue}
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
