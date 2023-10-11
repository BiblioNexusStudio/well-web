<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import type { VideoState } from './image-and-video-state';

    export let videoState: VideoState;

    function onLoadedMetadata() {
        videoState.duration = videoState.element?.duration ?? 0;
        videoState.isLoading = false;
    }

    function onError() {
        videoState.isLoading = false;
        videoState.hasError = true;
    }

    function onPause() {
        videoState.isPlaying = false;
        videoState.stopSyncingSeekPosition();
    }

    function onPlay() {
        if (videoState.element) {
            videoState.element.muted = videoState.isMuted;
        }
        videoState.isPlaying = true;
        videoState.syncingIntervalId = setInterval(() => {
            if (videoState.element) {
                videoState.rangeValue = (videoState.element.currentTime / videoState.element.duration) * 100;
                videoState.currentTime = videoState.element.currentTime;
            }
        }, 50);
    }

    function onEnded() {
        videoState.stopSyncingSeekPosition();
        videoState.isPlaying = false;
        if (videoState.element) {
            videoState.element.currentTime = 0;
        }
        videoState.currentTime = 0;
        videoState.rangeValue = 0;
    }

    function onVolumeChange() {
        if (videoState.element) {
            videoState.isMuted = videoState.element.muted;
        }
    }
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video
    bind:this={videoState.element}
    on:loadedmetadata={onLoadedMetadata}
    on:error={onError}
    on:pause={onPause}
    on:play={onPlay}
    on:volumechange={onVolumeChange}
    on:ended={onEnded}
    class="rounded-lg object-contain"
    playsinline
>
    <source src={`${cachedOrRealUrl(videoState.url ?? '')}#t=0.001`} />
</video>
