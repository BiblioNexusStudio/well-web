<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { lookupLanguageInfoById } from '$lib/stores/language.store';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
    import { isOnline } from '$lib/stores/is-online.store';
    import { availableBibles } from '$lib/utils/data-handlers/bible';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import SwishHeader from '$lib/components/SwishHeader.svelte';
    import { currentGuide } from '$lib/stores/parent-resource.store';
    import { PredeterminedPassageGuides } from '$lib/types/resource';

    export let showBookChapterVerseMenu: boolean;
    export let showBookPassageSelectorPane: boolean;

    $: availableBiblesPromise = availableBibles($isOnline);

    function openBookChapterVerseMenu() {
        const currentGuideId = $currentGuide?.id;
        if (currentGuideId && PredeterminedPassageGuides.includes(currentGuideId)) {
            showBookPassageSelectorPane = true;
        } else {
            showBookChapterVerseMenu = true;
        }
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
    <SwishHeader
        bgcolor="bg-[#6172F3]"
        title={$translate('page.bibleMenu.bible.value')}
        subtitle={$translate('page.bibleMenu.selectBible.value')}
    />
    {#await availableBiblesPromise}
        <FullPageSpinner />
    {:then bibles}
        <div class="flex w-full flex-col items-center overflow-y-scroll">
            {#each bibles as bible}
                {@const isPreferredBible = $preferredBibleIds.includes(bible.id)}
                <button
                    on:click={() => updatePreferredBibleIds(bible.id, isPreferredBible)}
                    class="my-2 flex w-11/12 flex-wrap rounded-xl p-4 {isPreferredBible
                        ? 'border-2 border-[#3db6e7] bg-[#f0faff]'
                        : 'border'}"
                    data-app-insights-event-name="bible-menu-bible-selected"
                >
                    <span class="text-sm">{bible.name} ({bible.abbreviation})</span>
                    <span class="mx-1 text-sm">-</span>
                    <span class="text-sm text-[#98A2B3]">{lookupLanguageInfoById(bible.languageId)?.iso6393Code}</span>
                </button>
            {:else}
                <h3 class="my-2">{$translate('page.bibleMenu.noBibles.value')}</h3>
            {/each}
        </div>

        <div class="mb-24 flex flex-grow items-end px-4">
            <button
                disabled={$preferredBibleIds.length === 0}
                on:click={openBookChapterVerseMenu}
                class="btn btn-primary w-full"
                data-app-insights-event-name="bible-menu-go-to-passage-button-clicked"
                >{$translate('page.bibleMenu.goToPassage.value')}</button
            >
        </div>
    {/await}
</div>
