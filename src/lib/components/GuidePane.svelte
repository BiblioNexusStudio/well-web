<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { guideResources, setCurrentGuide, currentGuide } from '$lib/stores/parent-resource.store';
    import type { ApiParentResource } from '$lib/types/resource';
    import { closeAllPassagePageMenus, openPassageMenu } from '$lib/stores/passage-page.store';
    import { selectedId, selectedBookIndex } from '$lib/stores/passage-form.store';

    export let guidePane: CupertinoPane;
    export let isShowing: boolean;

    function selectGuideAndHandleMenu(guideResource: ApiParentResource) {
        setCurrentGuide(guideResource);
        isShowing = false;

        if ($selectedId === 'default' || $selectedBookIndex === 'default') {
            openPassageMenu();
        } else {
            closeAllPassagePageMenus();
        }
    }

    onMount(() => {
        const bottomBarHeight = parseFloat(getComputedStyle(document.documentElement).fontSize) * 4;
        guidePane = new CupertinoPane('#guide-pane', {
            backdrop: true,
            topperOverflow: true,
            bottomOffset: bottomBarHeight,
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });
    });
</script>

<div id="guide-pane">
    <div class="flex w-full flex-col items-center">
        <h3 class="my-2 font-bold capitalize">{$translate('page.guideMenu.selectGuide.value')}</h3>
        <hr class="my-2 w-full" />
        {#each $guideResources as guideResource}
            {@const isCurrentGuide = guideResource === $currentGuide}
            <button
                on:click={() => selectGuideAndHandleMenu(guideResource)}
                class="my-2 flex w-11/12 rounded-xl p-4 {isCurrentGuide
                    ? 'border-2 border-[#3db6e7] bg-[#f0faff]'
                    : 'border'}"
            >
                <span class="text-sm">{guideResource.displayName}</span>
                <span class="mx-1 text-sm">-</span>
                <span class="text-sm text-[#98A2B3]">{guideResource.shortName}</span>
            </button>
        {/each}
    </div>
</div>
