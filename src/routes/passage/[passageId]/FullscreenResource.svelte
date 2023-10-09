<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import chevronRight from 'svelte-awesome/icons/chevronRight';
    import refresh from 'svelte-awesome/icons/refresh';
    import { Icon } from 'svelte-awesome';
    import type { ImageResource } from './types';
    import { _ as translate } from 'svelte-i18n';
    import { trapFocus } from '$lib/utils/trap-focus';

    export let currentIndex: number | null;
    export let resources: ImageResource[];

    let container: HTMLDivElement;
    let topBarDiv: HTMLDivElement;
    let nameDiv: HTMLDivElement;
    let controlsDiv: HTMLDivElement;
    let image: HTMLImageElement;

    let isLoading = true;

    function setImageDimensions() {
        if (container && topBarDiv && nameDiv && controlsDiv && image) {
            const availableHeight =
                container.clientHeight - topBarDiv.clientHeight - nameDiv.clientHeight - controlsDiv.clientHeight;
            const aspectRatio = image.naturalWidth / image.naturalHeight;
            const widthBasedOnHeight = availableHeight * aspectRatio;
            if (widthBasedOnHeight > container.clientWidth - 32) {
                image.style.width = `${container.clientWidth - 32}px`;
                image.style.height = `${(container.clientWidth - 32) / aspectRatio}px`;
            } else {
                image.style.width = `${widthBasedOnHeight}px`;
                image.style.height = `${availableHeight}px`;
            }
        }
    }

    let currentResource: ImageResource | null = null;
    $: currentResource = currentIndex === null ? null : resources[currentIndex];

    function previousItem() {
        if (currentIndex !== null && currentIndex > 0) {
            isLoading = true;
            currentIndex -= 1;
        }
    }

    function nextItem() {
        if (currentIndex !== null && currentIndex < resources.length - 1) {
            isLoading = true;
            currentIndex += 1;
        }
    }
</script>

<svelte:window
    on:resize={setImageDimensions}
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
                <div class="flex-grow" />
                <div class="text-sm text-gray-50">
                    {$translate('page.passage.resourcePane.fullscreen.currentOfTotalLabel.value', {
                        values: { current: (currentIndex ?? -1) + 1, total: resources.length },
                    })}
                </div>
            </div>
            <div class="flex-grow" />
            <div>
                <div class={!isLoading ? 'hidden' : 'absolute inset-0 flex'}>
                    <Icon class="self-center mx-auto text-gray-50" data={refresh} scale={2} spin />
                </div>
                <div class={isLoading ? 'opacity-0' : null}>
                    <div class="px-4">
                        <img
                            on:load={() => {
                                setImageDimensions();
                                isLoading = false;
                            }}
                            bind:this={image}
                            class="rounded-lg object-contain"
                            src={currentResource?.url ? cachedOrRealUrl(currentResource.url) : ''}
                            alt={currentResource?.displayName}
                        />
                    </div>
                    <div bind:this={nameDiv} class="text-sm text-gray-50 flex flex-row p-4 w-full max-w-[65ch]">
                        {currentResource?.displayName}
                        <div class="flex-grow" />
                    </div>
                </div>
            </div>
            <div class="flex-grow" />
            <div bind:this={controlsDiv} class="flex flex-row p-4 w-full max-w-[65ch]">
                <div class="flex-grow" />
                <button
                    disabled={currentIndex === 0}
                    class="btn btn-link text-gray-50 {currentIndex === 0 && 'opacity-0'}"
                    on:click={previousItem}><Icon data={chevronLeft} /></button
                >
                <div class="flex-grow" />
                <button
                    disabled={currentIndex === resources.length - 1}
                    class="btn btn-link text-gray-50 {currentIndex === resources.length - 1 && 'opacity-0'}"
                    on:click={nextItem}><Icon data={chevronRight} /></button
                >
                <div class="flex-grow" />
            </div>
        </div>
    </div>
{/if}
