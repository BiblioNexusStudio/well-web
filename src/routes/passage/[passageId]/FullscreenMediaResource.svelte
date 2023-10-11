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

    export let currentIndex: number | null;
    export let resources: ImageOrVideoResource[];

    let container: HTMLDivElement;
    let topBarDiv: HTMLDivElement;
    let controlsDiv: HTMLDivElement;

    $: isLoading = videoState.isLoading || imageState.isLoading;
    $: hasError = videoState.hasError || imageState.hasError;

    let videoState = new VideoState();
    let imageState = new ImageState();

    function setupState(index: number | null) {
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

    function setDimensions(_: unknown[]) {
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

    $: setDimensions([videoState.element, videoState.sliderElement, imageState.element]);

    let currentResource: ImageOrVideoResource | null = null;
    $: currentResource = currentIndex === null ? null : resources[currentIndex];

    $: setupState(currentIndex);

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
</script>

<svelte:window
    on:resize={() => setDimensions([])}
    on:keydown={(key) => {
        if (key.key === 'ArrowLeft') {
            previousItem();
        } else if (key.key === 'ArrowRight') {
            nextItem();
        }
    }}
/>

{#if currentIndex !== null}
    <div use:trapFocus class="fixed inset-0 z-50 bg-black w-full">
        <div bind:this={container} class="absolute inset-0 flex flex-col items-center">
            <div bind:this={topBarDiv} class="flex flex-row px-4 py-3 items-center w-full max-w-[65ch]">
                <button class="btn btn-link text-gray-50" on:click={() => (currentIndex = null)}
                    ><Icon data={chevronLeft} /></button
                >
                <div class="flex-grow">
                    <div class="w-full text-sm text-gray-50 text-center">
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
                <div class={!isLoading ? 'hidden' : 'absolute inset-0 flex pointer-events-none'}>
                    <Icon class="self-center mx-auto text-gray-50" data={refresh} scale={2} spin />
                </div>
                <div class={!hasError ? 'hidden' : 'absolute inset-0 flex pointer-events-none'}>
                    <Icon class="self-center mx-auto text-gray-50" data={warning} scale={2} />
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
            <div bind:this={controlsDiv} class="flex flex-row p-4 w-full max-w-[65ch]">
                <div class="flex-grow" />
                {#if videoState.active && !videoState.isLoading}
                    <button
                        class="btn btn-link text-gray-50 mr-8 w-12"
                        on:click={videoState.toggleMute.bind(videoState)}
                        ><Icon data={videoState.isMuted ? volumeOff : volumeUp} /></button
                    >
                {/if}
                <button
                    disabled={currentIndex === 0}
                    class="btn btn-link text-gray-50 disabled:bg-opacity-0 disabled:text-gray-50 disabled:text-opacity-25"
                    on:click={previousItem}><Icon data={chevronLeft} /></button
                >
                {#if videoState.active && !videoState.isLoading}
                    <button
                        class="btn btn-primary w-12 h-12 text-gray-50 mx-8"
                        on:click={videoState.playPauseVideo.bind(videoState)}
                        ><Icon data={videoState.isPlaying ? pause : play} /></button
                    >
                {:else}
                    <div class="flex-grow" />
                {/if}
                <button
                    disabled={currentIndex === resources.length - 1}
                    class="btn btn-link text-gray-50 disabled:bg-opacity-0 disabled:text-gray-50
                    disabled:text-opacity-25"
                    on:click={nextItem}><Icon data={chevronRight} /></button
                >
                {#if videoState.active && !videoState.isLoading}
                    <button
                        class="btn btn-link text-gray-50 ml-8"
                        on:click={videoState.makeVideoFullscreen.bind(videoState)}><Icon data={expand} /></button
                    >
                {/if}
                <div class="flex-grow" />
            </div>
        </div>
    </div>
{/if}
