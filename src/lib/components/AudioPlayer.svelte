<script lang="ts">
    export let audioFile: string = 'https://cdn.aquifer.bible/testcontainer1/BSB_01_Gen_001_H.mp3';

    import { Howl, Howler } from 'howler';

    const formatTime = (totalSeconds: number) => {
        totalSeconds = Math.floor(totalSeconds);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const sound = new Howl({
        src: audioFile,
        onplay: () => (isAudioPlaying = true),
        onpause: () => (isAudioPlaying = false),
        onend: () => (isAudioPlaying = false),
    });

    let isAudioPlaying: boolean = false;
    let currentTime: number = 0;
    let totalTime: number = sound.duration();

    let timer = setInterval(() => {
        currentTime = sound.seek();

        let slider = document.getElementById('song-percentage-played');
        slider.style.backgroundSize = currentTime / totalTime + '% 100%';
    }, 500);
</script>

<div
    class="relative w-player flex flex-row justify-center items-center rounded-xl border-player-dark-border backdrop-blur-xl"
>
    <div class="grow-0 cursor-pointer amplitude-play-pause w-[16px] items-end">
        <button
            class={isAudioPlaying ? 'hidden' : ''}
            on:click={() => {
                sound.play();
            }}
        >
            <svg
                id="play-icon"
                width="16"
                height="19"
                viewBox="0 0 31 37"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class=""
            >
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M29.6901 16.6608L4.00209 0.747111C2.12875 -0.476923 0.599998 0.421814 0.599998 2.75545V33.643C0.599998 35.9728 2.12747 36.8805 4.00209 35.6514L29.6901 19.7402C29.6901 19.7402 30.6043 19.0973 30.6043 18.2012C30.6043 17.3024 29.6901 16.6608 29.6901 16.6608Z"
                    class="fill-slate-400"
                />
            </svg>
        </button>

        <button class={isAudioPlaying ? '' : 'hidden'} on:click={() => sound.pause()}>
            <svg
                id="pause-icon"
                width="12"
                height="18"
                viewBox="0 0 24 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="6" height="36" rx="3" class="fill-slate-400" />
                <rect x="18" width="6" height="36" rx="3" class="fill-slate-400" />
            </svg>
        </button>
    </div>

    <div class="w-full flex flex-col grow z-50 mx-6">
        <input type="range" id="song-percentage-played" class="" step=".1" />
    </div>

    <span class="w-24 items-start text-xs font-sans tracking-wide font-medium text-gray-500"
        >{formatTime(currentTime)} / {formatTime(totalTime)}</span
    >
</div>

<style>
    .w-player {
        width: 640px;
    }

    .rounded-xl {
        border-radius: 0.75rem;
    }

    .font-sans {
        font-family: Inter var, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
            'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
    }

    .text-xs {
        font-size: 0.75rem;
        line-height: 1rem;
    }

    .font-medium {
        font-weight: 500;
    }

    .tracking-wide {
        letter-spacing: 0.025em;
    }

    .text-gray-500 {
        --tw-text-opacity: 1;
        color: rgb(107 114 128 / var(--tw-text-opacity));
    }

    input[type='range'] {
        background: #0f172a;
        background-image: linear-gradient(#38bdf8, #38bdf8);
        background-size: 0% 100%;
        box-shadow: 0px 1px 1px rgba(255, 255, 255, 0.06);
        background-repeat: no-repeat;
    }

    input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        -moz-appearance: none;
        height: 24px;
        width: 24px;
        border-radius: 50%;
        background: #e2e8f0;
        cursor: ew-resize;
        box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06);
        -webkit-transition: background 0.3s ease-in-out;
        transition: background 0.3s ease-in-out;
    }

    input[type='range']::-webkit-slider-runnable-track,
    input[type='range']::-moz-range-track,
    input[type='range']::-ms-track {
        -webkit-appearance: none;
        appearance: none;
        -moz-appearance: none;
        box-shadow: none;
        border: none;
        background: transparent;
    }

    div#song-saved.saved svg path {
        fill: #38bdf8;
        stroke: #38bdf8;
    }

    div.amplitude-shuffle.amplitude-shuffle-on svg path {
        fill: #38bdf8;
    }

    div.amplitude-repeat-song.amplitude-repeat-song-on svg path {
        fill: #38bdf8;
    }

    .border-player-dark-border {
        border-color: rgba(255, 255, 255, 0.16);
    }

    .border-cover-dark-border {
        border-color: rgba(255, 255, 255, 0.1);
    }

    .border-gray-900 {
        --tw-border-opacity: 1;
        border-color: rgb(17 24 39 / var(--tw-border-opacity));
    }

    .border-play-pause-dark-border {
        border-color: rgba(255, 255, 255, 0.06);
    }

    .bg-\[\#0A1122\] {
        --tw-bg-opacity: 1;
        background-color: rgb(10 17 34 / var(--tw-bg-opacity));
    }

    .bg-player-dark-background {
        background-color: rgba(30, 41, 59, 0.7);
    }

    .bg-control-panel-dark-background {
        background-color: rgba(23, 31, 50, 0.5);
    }

    .bg-play-pause-dark-background {
        --tw-bg-opacity: 1;
        background-color: rgb(47 59 79 / var(--tw-bg-opacity));
    }

    .fill-slate-400 {
        fill: #94a3b8;
    }

    .shadow-player-dark {
        --tw-shadow: inset 0px 2px 4px rgba(255, 255, 255, 0.06);
        --tw-shadow-colored: inset 0px 2px 4px var(--tw-shadow-color);
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000),
            var(--tw-shadow);
    }

    .backdrop-blur-xl {
        --tw-backdrop-blur: blur(24px);
        -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness)
            var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate)
            var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate)
            var(--tw-backdrop-sepia);
        backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness)
            var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate)
            var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate)
            var(--tw-backdrop-sepia);
    }
</style>
