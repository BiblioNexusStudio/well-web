<script lang="ts">
    import { navigating, page } from '$app/stores';
    import { cachedOrRealUrl } from '$lib/data-cache';
    import PlayMediaIcon from '$lib/icons/PlayMediaIcon.svelte';
    import PauseMediaIcon from '$lib/icons/PauseMediaIcon.svelte';
    import { Howl } from 'howler';
    import type { HowlOptions } from 'howler';
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

    $: if ($navigating) {
        if ($navigating.to?.url.pathname !== $page.url.pathname) {
            sound.unload();
        }
    }

    const hasCustomTime = endTime !== null;
    let playId: number | undefined = undefined;
    let isAudioPlaying = false;
    let currentTime = startTime;
    let totalTime = 0;
    let timer: Timer;
    $: currentTimeOffset = currentTime - startTime;
    $: rangeValue = totalTime === 0 ? 0 : 100 * (currentTimeOffset / totalTime);
    $: timeDisplayValue = `${formatTime(currentTimeOffset)} / ${formatTime(totalTime)}`;

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

    const onPlayClick = () => {
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
</script>

<div class="relative w-3/4 flex flex-row justify-center items-center rounded-xl">
    <div class="grow-0 cursor-pointer amplitude-play-pause w-[16px]">
        <button class={isAudioPlaying ? 'hidden' : ''} on:click={onPlayClick}>
            <PlayMediaIcon />
        </button>

        <button class={isAudioPlaying ? '' : 'hidden'} on:click={() => sound.pause(playId)}>
            <PauseMediaIcon />
        </button>
    </div>

    <div class="w-full flex flex-col grow mx-4 h-[19px]">
        <input
            type="range"
            id="song-percentage-played"
            class="range range-xxs range-primary"
            step="any"
            min="0"
            max="100"
            on:change={onRangeChange}
            on:input={onRangeInput}
            bind:value={rangeValue}
        />
    </div>

    <span class="w-24 items-start text-xs font-sans font-medium text-primary h-[19px]">{timeDisplayValue}</span>
</div>

<style>
    .range-xxs {
        height: 0.75rem /* 16px */;
    }
    .range-xxs::-webkit-slider-runnable-track {
        height: 0.75rem /* 4px */;
    }
    .range-xxs::-moz-range-track {
        height: 0.75rem /* 4px */;
    }
    .range-xxs::-webkit-slider-thumb {
        height: 0.75rem /* 16px */;
        width: 0.75rem /* 16px */;
        --filler-offset: 0.4rem /* 6.4px */;
    }
    .range-xxs::-moz-range-thumb {
        height: 0.75rem /* 16px */;
        width: 0.75rem /* 16px */;
        --filler-offset: 0.4rem /* 6.4px */;
    }
</style>
