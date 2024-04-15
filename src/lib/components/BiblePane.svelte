<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { bibles, bibleSetByUser } from '$lib/stores/bibles.store';
    import type { BaseBible } from '$lib/types/bible-text-content';
    import { closeAllPassagePageMenus } from '$lib/stores/passage-page.store';
    import { lookupLanguageInfoById } from '$lib/stores/language.store';

    export let biblePane: CupertinoPane;
    export let isShowing: boolean;

    function setBibleAndHandleMenus(bible: BaseBible) {
        $bibleSetByUser = bible;
        isShowing = false;
        closeAllPassagePageMenus();
    }

    onMount(() => {
        const bottomBarHeight = parseFloat(getComputedStyle(document.documentElement).fontSize) * 4;
        biblePane = new CupertinoPane('#bible-pane', {
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

<div id="bible-pane">
    <div class="flex w-full flex-col items-center">
        <h3 class="my-2 font-bold">{$translate('page.bibleMenu.selectBible.value')}</h3>
        <hr class="my-2 w-full" />
        <div class="flex h-[210px] flex-col items-center overflow-y-auto">
            {#each $bibles as bible}
                {@const isCurrentBible = bible === $bibleSetByUser}
                <button
                    on:click={() => setBibleAndHandleMenus(bible)}
                    class="my-2 flex w-11/12 flex-wrap rounded-xl p-4 {isCurrentBible
                        ? 'border-2 border-[#3db6e7] bg-[#f0faff]'
                        : 'border'}"
                >
                    <span class="text-sm">{bible.name} ({bible.abbreviation})</span>
                    <span class="mx-1 text-sm">-</span>
                    <span class="text-sm text-[#98A2B3]">{lookupLanguageInfoById(bible.languageId)?.iso6393Code}</span>
                </button>
            {/each}
        </div>
        {#if $bibles.length === 0}
            <h3 class="my-2 font-bold">{$translate('page.bibleMenu.noBibles.value')}</h3>
        {/if}
    </div>
</div>
