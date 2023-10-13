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

<div bind:this={videoState.sliderElement} class="mx-auto flex w-full max-w-xl flex-row items-center px-4 pt-4">
    <div class="pr-2 font-mono text-sm text-gray-50">
        {timeDisplay}
    </div>
    <input
        type="range"
        class="range-video range range-primary bg-gray-50"
        step="any"
        min="0"
        max="100"
        on:change={onRangeChange}
        on:input={videoState.stopSyncingSeekPosition.bind(videoState)}
        value={videoState.rangeValue}
    />
    <div class="pl-2 font-mono text-sm text-gray-50">
        {totalTimeDisplay}
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
