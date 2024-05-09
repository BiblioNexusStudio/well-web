<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { currentGuide } from '$lib/stores/parent-resource.store';
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { fetchedBaseBibles, baseBibleSetByUser, bibleWellBibleSetByUser } from '$lib/stores/bibles.store';
    import type { BaseBible } from '$lib/types/bible-text-content';
    import { closeAllPassagePageMenus } from '$lib/stores/passage-page.store';
    import { lookupLanguageInfoById } from '$lib/stores/language.store';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';

    export let biblePane: CupertinoPane;
    export let isShowing: boolean;
    export let showBookPassageMenu: boolean;
    export let showBookChapterVerseMenu: boolean;

    function setBibleAndHandleMenus(bible: BaseBible) {
        if (!$preferredBibleIds.includes(bible.id)) {
            $preferredBibleIds.push(bible.id);
        }
        $baseBibleSetByUser = bible;
        localStorage.setItem(bibleWellBibleSetByUser, JSON.stringify(bible.id));
        isShowing = false;
        closeAllPassagePageMenus();

        if ($currentGuide) {
            showBookPassageMenu = true;
        } else {
            showBookChapterVerseMenu = true;
        }
    }

    onMount(() => {
        biblePane = new CupertinoPane('#bible-pane', {
            backdrop: true,
            topperOverflow: true,
            initialBreak: 'top',
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
        <div class="flex w-full flex-col items-center overflow-y-auto">
            {#each $fetchedBaseBibles as bible}
                {@const isCurrentBible = bible === $baseBibleSetByUser}
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
        {#if $fetchedBaseBibles.length === 0}
            <h3 class="my-2 font-bold">{$translate('page.bibleMenu.noBibles.value')}</h3>
        {/if}
    </div>
</div>
