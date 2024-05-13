<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { bibles } from '$lib/stores/bibles.store';
    import { lookupLanguageInfoById } from '$lib/stores/language.store';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';

    export let showBookChapterVerseMenu: boolean;

    function openBookChapterVerseMenu() {
        showBookChapterVerseMenu = true;
    }

    function updatePreferredBibleIds(id: number, isChecked: boolean) {
        preferredBibleIds.update((ids) => {
            if (!isChecked && !ids.includes(id)) {
                return ids.concat([id]);
            } else if (isChecked && ids.includes(id)) {
                return ids.filter((existingId) => existingId !== id);
            }
            return ids;
        });
    }
</script>

<div class="z-50 flex h-full w-full flex-col">
    <div class="relative mb-6 flex h-[166px] w-full rounded-b-3xl bg-[#6172F3] pl-6 pt-12">
        <div class="absolute bottom-0 left-0 w-full">
            <img src="/menu-swish.png" alt="Menu Swish" class="h-auto w-full rounded-b-3xl" />
        </div>
        <div class="flex flex-col">
            <h2 class="z-10 mb-2 text-2xl font-bold text-white">{$translate('page.bibleMenu.bible.value')}</h2>
            <span class="z-10 text-sm text-white">{$translate('page.bibleMenu.selectBible.value')}</span>
        </div>
    </div>
    <div class="flex w-full flex-col items-center overflow-y-auto">
        {#each $bibles as bible}
            {@const isPreferredBible = $preferredBibleIds.includes(bible.id)}
            <button
                on:click={() => updatePreferredBibleIds(bible.id, isPreferredBible)}
                class="my-2 flex w-11/12 flex-wrap rounded-xl p-4 {isPreferredBible
                    ? 'border-2 border-[#3db6e7] bg-[#f0faff]'
                    : 'border'}"
            >
                <span class="text-sm">{bible.name} ({bible.abbreviation})</span>
                <span class="mx-1 text-sm">-</span>
                <span class="text-sm text-[#98A2B3]">{lookupLanguageInfoById(bible.languageId)?.iso6393Code}</span>
            </button>
        {/each}
        {#if $bibles.length === 0}
            <h3 class="my-2">{$translate('page.bibleMenu.noBibles.value')}</h3>
        {/if}
    </div>

    <div class="mb-24 flex flex-grow items-end px-4">
        <button on:click={openBookChapterVerseMenu} class="btn btn-primary w-full"
            >{$translate('page.bibleMenu.goToPassage.value')}</button
        >
    </div>
</div>
