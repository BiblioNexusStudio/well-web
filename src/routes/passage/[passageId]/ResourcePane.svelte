<script lang="ts">
    import type { ImageContent } from '$lib/types/file-manager';
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { cachedOrRealUrl } from '$lib/data-cache';
    import { _ as translate } from 'svelte-i18n';
    import { trapFocus } from '$lib/utils/trap-focus';
    import type { PassageResourceContent } from '$lib/types/passage';
    import { ResourceType } from '$lib/types/resource';
    import { asyncMap } from '$lib/utils/async-array';
    import {
        fetchDisplayNameForResourceContent,
        resourceContentApiFullUrl,
    } from '$lib/utils/data-handlers/resources/resource';

    interface ImageResource {
        displayName: string | null;
        url: string;
    }

    export let resourcePane: CupertinoPane;
    export let isShowing: boolean;
    export let resources: PassageResourceContent[] | undefined;
    export let activeTab: 'basic' | 'advanced' = 'basic';

    let imageResources: ImageResource[] = [];

    $: prepareUbsImageResources(resources || []);

    let fullscreenImage: ImageContent | null = null;

    onMount(() => {
        resourcePane = new CupertinoPane('#resource-pane', {
            parentElement: '#passage-page',
            buttonDestroy: false,
            bottomClose: true,
            fastSwipeClose: true,
            initialBreak: 'top',
            breaks: {
                top: {
                    enabled: true,
                    height: window.innerHeight - 50,
                },
                middle: { enabled: false },
                bottom: { enabled: false, height: window.screen.height - 300 },
            },
            lowerThanBottom: true,
            backdrop: true,
            backdropOpacity: 0.4,
            simulateTouch: false,
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });
    });

    function handleImageSelected(image: ImageContent) {
        fullscreenImage = image;
        isShowing = false;
    }

    async function prepareUbsImageResources(resources: PassageResourceContent[]) {
        imageResources = await asyncMap(
            resources.filter(({ typeName }) => typeName === ResourceType.UbsImages),
            async (resource) => ({
                displayName: await fetchDisplayNameForResourceContent(resource),
                url: resourceContentApiFullUrl(resource),
            })
        );
    }
</script>

<svelte:window
    on:keydown={(key) => {
        if (key.key === 'Escape') {
            if (fullscreenImage !== null) {
                fullscreenImage = null;
            } else if (isShowing) {
                isShowing = false;
            }
        }
    }}
/>

<button
    on:click={() => (fullscreenImage = null)}
    class="fixed inset-0 z-50 bg-black bg-opacity-40 w-full {fullscreenImage ? 'block' : 'hidden'}"
>
    <div class="absolute inset-0 flex flex-col">
        <div
            aria-label={fullscreenImage?.displayName}
            style={`background-image: url('${fullscreenImage?.url ? cachedOrRealUrl(fullscreenImage.url) : ''}')`}
            class="flex-1 bg-center bg-no-repeat bg-contain"
        />
        <div class="h-16 bg-secondary flex flex-row">
            <div class="text-xl text-base-content mx-auto self-center">
                {fullscreenImage?.displayName}
            </div>
        </div>
    </div>
</button>

<div id="resource-pane" use:trapFocus={isShowing} class="flex-grow px-4 pb-4 mb-16">
    <div class="text-lg font-semibold text-base-content pb-8">
        {$translate('page.passage.resourcePane.title.value')}
    </div>
    <div class="tabs !border-b-0 w-full mb-6">
        <button
            class="tab text-sm font-semibold tab-bordered {activeTab === 'basic'
                ? 'tab-active text-secondary-content !border-secondary-content !border-b-2'
                : 'text-gray-500 !border-b border-b-gray-200'}"
            on:click={() => (activeTab = 'basic')}>{$translate('page.passage.resourcePane.basicTab.value')}</button
        >
        <div class="flex-grow border-b border-b-gray-200" />
    </div>
    <div class={activeTab !== 'basic' ? 'hidden' : ''}>
        {#if imageResources.length}
            <div class="text-md font-semibold text-base-content pb-2">
                {$translate('page.passage.resourcePane.types.ubsImages.value')}
            </div>
            <div class="carousel space-x-2">
                {#each imageResources as image}
                    <button class="carousel-item flex-col" on:click={() => handleImageSelected(image)}>
                        <img
                            class="h-20 w-32 object-cover rounded-lg border border-gray-300 mb-1"
                            src={cachedOrRealUrl(image.url)}
                            alt={image.displayName}
                        />
                        <span class="text-sm text-neutral">{image.displayName}</span>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    :global(.cupertino-pane-wrapper .backdrop) {
        z-index: 30;
    }
    :global(.cupertino-pane-wrapper .pane) {
        z-index: 40;
    }
</style>
