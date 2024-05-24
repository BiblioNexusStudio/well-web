<script lang="ts">
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import chevronRight from 'svelte-awesome/icons/chevronRight';
    import play from 'svelte-awesome/icons/play';
    import pause from 'svelte-awesome/icons/pause';
    import refresh from 'svelte-awesome/icons/refresh';
    import { Icon } from 'svelte-awesome';
    import type { ImageOrVideoResource } from './types';
    import { _ as translate } from 'svelte-i18n';
    import { trapFocus } from '$lib/utils/trap-focus';
    import { expand, volumeOff, volumeUp, warning } from 'svelte-awesome/icons';
    import { ImageState, VideoState } from './image-and-video-state';
    import VideoElement from './VideoElement.svelte';
    import VideoSlider from './VideoSlider.svelte';
    import ImageElement from './ImageElement.svelte';
    import { onDestroy } from 'svelte';

    export let currentIndex: number | null;
    export let resources: ImageOrVideoResource[];

    let container: HTMLDivElement;
    let topBarDiv: HTMLDivElement;
    let controlsDiv: HTMLDivElement;

    let videoState = new VideoState();
    let imageState = new ImageState();

    $: isLoading = videoState.isLoading || imageState.isLoading;
    $: hasError = videoState.hasError || imageState.hasError;

    function setupImageOrVideoState(index: number | null) {
        imageState.reset();
        videoState.reset();
        if (index !== null) {
            const resource = resources[index];
            if (resource?.type === 'video') {
                videoState.activate(resource.url);
            } else if (resource?.type === 'image') {
                imageState.activate(resource.url, resource.displayName);
            }
        }
    }

    function setVideoOrImageDimensionsBasedOnAvailableHeight() {
        if (container && topBarDiv && controlsDiv) {
            if (imageState.active && imageState.element) {
                const availableHeight = container.clientHeight - topBarDiv.clientHeight - controlsDiv.clientHeight;
                const aspectRatio = imageState.element.naturalWidth / imageState.element.naturalHeight;
                const widthBasedOnHeight = availableHeight * aspectRatio;
                if (widthBasedOnHeight > container.clientWidth - 32) {
                    imageState.element.style.width = `${container.clientWidth - 32}px`;
                    imageState.element.style.height = `${(container.clientWidth - 32) / aspectRatio}px`;
                } else {
                    imageState.element.style.width = `${widthBasedOnHeight}px`;
                    imageState.element.style.height = `${availableHeight}px`;
                }
            } else if (videoState.active && videoState.element && videoState.sliderElement) {
                const availableHeight =
                    container.clientHeight -
                    topBarDiv.clientHeight -
                    controlsDiv.clientHeight -
                    videoState.sliderElement.clientHeight;
                const aspectRatio = videoState.element.videoWidth / videoState.element.videoHeight;
                const widthBasedOnHeight = availableHeight * aspectRatio;
                if (widthBasedOnHeight > container.clientWidth - 32) {
                    videoState.element.style.width = `${container.clientWidth - 32}px`;
                    videoState.element.style.height = `${(container.clientWidth - 32) / aspectRatio}px`;
                } else {
                    videoState.element.style.width = `${widthBasedOnHeight}px`;
                    videoState.element.style.height = `${availableHeight}px`;
                }
            }
        }
    }

    $: videoElement = videoState.element;
    $: sliderElement = videoState.sliderElement;
    $: imageElement = imageState.element;
    $: [videoElement, sliderElement, imageElement] && setVideoOrImageDimensionsBasedOnAvailableHeight();

    let currentResource: ImageOrVideoResource | null = null;
    $: currentResource = currentIndex === null ? null : resources[currentIndex] ?? null;

    // when the index changes, reset the current state and setup the new one
    $: setupImageOrVideoState(currentIndex);

    function previousItem() {
        if (currentIndex !== null && currentIndex > 0) {
            currentIndex -= 1;
        }
    }

    function nextItem() {
        if (currentIndex !== null && currentIndex < resources.length - 1) {
            currentIndex += 1;
        }
    }

    onDestroy(() => {
        imageState.reset();
        videoState.reset();
    });
</script>

<svelte:window
    on:resize={setVideoOrImageDimensionsBasedOnAvailableHeight}
    on:keydown={(key) => {
        if (key.key === 'ArrowLeft') {
            previousItem();
        } else if (key.key === 'ArrowRight') {
            nextItem();
        } else if (key.key === ' ' && videoState.active) {
            key.preventDefault();
            videoState.playPauseVideo();
        }
    }}
/>

{#if currentIndex !== null}
    <div use:trapFocus class="fixed inset-0 z-50 w-full bg-black">
        <div bind:this={container} class="absolute inset-0 flex flex-col items-center">
            <div bind:this={topBarDiv} class="flex w-full max-w-[65ch] flex-row items-center px-4 py-3">
                <button
                    class="btn btn-link text-gray-50"
                    on:click={() => (currentIndex = null)}
                    data-app-insights-event-name="fullscreen-close-button-clicked"><Icon data={chevronLeft} /></button
                >
                <div class="flex-grow">
                    <div class="w-full text-center text-sm text-gray-50">
                        {currentResource?.displayName}
                    </div>
                </div>
                <div class="text-sm text-gray-50">
                    {$translate('page.passage.resourcePane.fullscreen.currentOfTotalLabel.value', {
                        values: { current: (currentIndex ?? -1) + 1, total: resources.length },
                    })}
                </div>
            </div>
            <div class="flex-grow" />
            <div>
                <div class={!isLoading ? 'hidden' : 'pointer-events-none absolute inset-0 flex'}>
                    <Icon class="mx-auto self-center text-gray-50" data={refresh} scale={2} spin />
                </div>
                <div class={!hasError ? 'hidden' : 'pointer-events-none absolute inset-0 flex'}>
                    <Icon class="mx-auto self-center text-gray-50" data={warning} scale={2} />
                </div>
                <div class={isLoading ? 'opacity-0' : null}>
                    <div class="px-4">
                        {#key currentIndex}
                            {#if imageState.active}
                                <ImageElement bind:imageState />
                            {:else if videoState.active}
                                <VideoElement bind:videoState />
                            {/if}
                        {/key}
                    </div>
                </div>
            </div>
            <div class="flex-grow" />
            {#if videoState.active && !videoState.isLoading}
                <VideoSlider bind:videoState />
            {/if}
            <div bind:this={controlsDiv} class="flex w-full max-w-md flex-row p-4">
                <div class="flex-grow" />
                {#if videoState.active && !videoState.isLoading}
                    <button
                        class="btn btn-link w-12 text-gray-50"
                        on:click={videoState.toggleMute.bind(videoState)}
                        data-app-insights-event-name="fullscreen-mute-button-clicked"
                        ><Icon data={videoState.isMuted ? volumeOff : volumeUp} /></button
                    >
                    <div class="flex-grow" />
                {/if}
                <button
                    disabled={currentIndex === 0}
                    class="btn btn-link text-gray-50 disabled:bg-opacity-0 disabled:text-transparent disabled:text-opacity-25"
                    data-app-insights-event-name="fullscreen-previous-button-clicked"
                    on:click={previousItem}><Icon data={chevronLeft} /></button
                >
                {#if videoState.active && !videoState.isLoading}
                    <button
                        class="btn btn-primary mx-8 h-12 w-12 text-gray-50"
                        on:click={videoState.playPauseVideo.bind(videoState)}
                        data-app-insights-event-name="fullscreen-play-pause-button-clicked"
                        ><Icon data={videoState.isPlaying ? pause : play} /></button
                    >
                {:else}
                    <div class="mx-8 h-12 w-12" />
                {/if}
                <button
                    disabled={currentIndex === resources.length - 1}
                    class="btn btn-link text-gray-50 disabled:bg-opacity-0 disabled:text-transparent
                    disabled:text-opacity-25"
                    data-app-insights-event-name="fullscreen-next-button-clicked"
                    on:click={nextItem}><Icon data={chevronRight} /></button
                >
                {#if videoState.active && !videoState.isLoading}
                    <div class="flex-grow" />
                    <button
                        class="btn btn-link text-gray-50"
                        on:click={videoState.makeVideoFullscreen.bind(videoState)}
                        data-app-insights-event-name="fullscreen-expand-button-clicked"><Icon data={expand} /></button
                    >
                {/if}
                <div class="flex-grow" />
            </div>
        </div>
    </div>
{/if}
