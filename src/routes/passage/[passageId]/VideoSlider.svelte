<script lang="ts">
    import { formatSecondsToTimeDisplay } from '$lib/utils/time';
    import type { VideoState } from './image-and-video-state';

    export let videoState: VideoState;

    function onRangeChange(e: Event) {
        if (videoState.element) {
            videoState.element.pause();
            videoState.element.currentTime =
                (parseFloat((e.target as HTMLInputElement).value) / 100) * videoState.element.duration;
            videoState.currentTime = videoState.element.currentTime;
            videoState.element.play();
        }
    }

    $: timeDisplay = formatSecondsToTimeDisplay(videoState.currentTime);
    $: totalTimeDisplay = formatSecondsToTimeDisplay(videoState.duration);
</script>

<div bind:this={videoState.sliderElement} class="pt-4 px-4 flex flex-row items-center w-full max-w-xl mx-auto">
    <input
        type="range"
        class="range range-video range-primary bg-gray-50"
        step="any"
        min="0"
        max="100"
        on:change={onRangeChange}
        on:input={videoState.stopSyncingSeekPosition.bind(videoState)}
        value={videoState.rangeValue}
    />
    <div class="text-gray-50 text-sm font-mono pl-2 flex flex-row space-x-1">
        <div>{timeDisplay}</div>
        /
        <div>{totalTimeDisplay}</div>
    </div>
</div>

<style>
    :global(.range-video) {
        height: 0.75rem;
    }
    :global(.range-video::-webkit-slider-runnable-track) {
        height: 0.75rem;
    }
    :global(.range-video::-moz-range-track) {
        height: 0.75rem;
    }
    :global(.range-video::-webkit-slider-thumb) {
        height: 0.75rem;
        width: 0.75rem;
        --filler-offset: 0.4rem;
    }
    :global(.range-video::-moz-range-thumb) {
        height: 0.75rem;
        width: 0.75rem;
        --filler-offset: 0.4rem;
    }
</style>
