<script lang="ts">
    import { Howl } from 'howler';
    import type { HowlOptions } from 'howler';
    type Timer = ReturnType<typeof setInterval>;

    export let audioFile: string;
    export let startTime = 0;
    export let endTime = 0;

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

    const hasCustomTime = startTime !== 0 && endTime !== 0;
    let playId: number | undefined = undefined;
    let isAudioPlaying = false;
    let currentTime = startTime;
    let totalTime = 0;
    let timer: Timer;
    $: currentTimeOffset = currentTime - startTime;
    $: rangeValue = totalTime === 0 ? 0 : 100 * (currentTimeOffset / totalTime);
    $: timeDisplayValue = `${formatTime(currentTimeOffset)} / ${formatTime(totalTime)}`;

    const howlOptions: HowlOptions = {
        src: audioFile,
        onplay: () => {
            isAudioPlaying = true;
            timer = setInterval(() => {
                currentTime = sound.seek(playId);
                if (!sound.playing(playId)) clearInterval(timer);
            }, 50);

            console.log(`next playid ${playId}`);
            activePlayId = playId;
        },
        onpause: () => {
            isAudioPlaying = false;
        },
        onend: () => {
            isAudioPlaying = false;
        },
        onload: () => {
            totalTime = hasCustomTime ? endTime - startTime : sound.duration(playId);
        },
    };

    // If you specify a section, you must play a section.
    if (hasCustomTime) {
        howlOptions.sprite = {
            audioSection: [1000 * startTime, 1000 * (endTime - startTime)],
        };
    }

    const sound = new Howl(howlOptions);

    const onRangeChange = (e: Event) => {
        currentTime = startTime + (e.target.value / 100) * totalTime;

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
            <svg
                id="play-icon"
                width="16"
                height="19"
                viewBox="0 0 31 37"
                fill="#94a3b8"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M29.6901 16.6608L4.00209 0.747111C2.12875 -0.476923 0.599998 0.421814 0.599998 2.75545V33.643C0.599998 35.9728 2.12747 36.8805 4.00209 35.6514L29.6901 19.7402C29.6901 19.7402 30.6043 19.0973 30.6043 18.2012C30.6043 17.3024 29.6901 16.6608 29.6901 16.6608Z"
                />
            </svg>
        </button>

        <button class={isAudioPlaying ? '' : 'hidden'} on:click={() => sound.pause(playId)}>
            <svg
                id="pause-icon"
                width="16"
                height="18"
                viewBox="0 0 24 36"
                fill="#94a3b8"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="6" height="36" rx="3" />
                <rect x="18" width="6" height="36" rx="3" />
            </svg>
        </button>
    </div>

    <div class="w-full flex flex-col grow mx-4 h-[19px]">
        <input
            type="range"
            id="song-percentage-played"
            class="range range-xs range-info"
            step="any"
            min="0"
            max="100"
            on:change={onRangeChange}
            on:input={onRangeInput}
            bind:value={rangeValue}
        />
    </div>

    <span class="w-24 items-start text-xs font-sans font-medium text-gray-500 h-[19px]"
        >{timeDisplayValue}</span
    >
</div>
