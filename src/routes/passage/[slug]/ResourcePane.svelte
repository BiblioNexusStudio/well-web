<script lang="ts">
    import type { CbbtErImageContent } from '$lib/types/file-manager';
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { cachedOrRealUrl } from '$lib/data-cache';
    import { _ as translate } from 'svelte-i18n';
    import { trapFocus } from '$lib/utils/trap-focus';

    export let resourcePane: CupertinoPane;
    export let isShowing: boolean;
    export let images: CbbtErImageContent[] | undefined;

    let fullscreenImage: CbbtErImageContent | null = null;

    onMount(() => {
        resourcePane = new CupertinoPane('#resource-pane', {
            parentElement: '#passage-page-content',
            buttonDestroy: false,
            bottomClose: true,
            fastSwipeClose: true,
            lowerThanBottom: true,
            upperThanTop: false,
            backdrop: true,
            backdropOpacity: 0.4,
            fitHeight: true,
            simulateTouch: false,
            maxFitHeight: window.screen.height / 2 + 100,
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });
    });

    function handleImageSelected(image: CbbtErImageContent) {
        fullscreenImage = image;
        isShowing = false;
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
    class={`fixed inset-0 z-50 bg-black bg-opacity-40 ${fullscreenImage ? 'block' : 'hidden'}`}
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

<div id="resource-pane" use:trapFocus={isShowing} class="px-4 pb-4 mb-16">
    <div class="text-lg font-semibold text-base-content pb-4">{$translate('page.passage.nav.resources.value')}</div>
    <div class="flex flex-col space-y-3">
        {#each images || [] as image}
            <button class="flex flex-row items-center" on:click={() => handleImageSelected(image)}>
                <img
                    class="my-1 h-10 w-10 object-cover rounded-lg border border-gray-300"
                    src={cachedOrRealUrl(image.url)}
                    alt={image.displayName}
                />
                <span class="text-sm font-medium text-base-700 pl-4">{image.displayName}</span>
            </button>
        {/each}
    </div>
</div>
