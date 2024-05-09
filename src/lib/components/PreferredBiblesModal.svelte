<script lang="ts">
    import type { SimpleFrontendBibleBook, ApiBibleContents } from '$lib/types/bible-text-content';
    import SearchInput from './SearchInput.svelte';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
    import { currentLanguageInfo, lookupLanguageInfoById } from '$lib/stores/language.store';
    import { getBibleTextByParams } from '$lib/utils/data-handlers/resources/passages';
    import {
        currentBookNumber,
        bibleDataFetchedByUser,
        filterBookByRange,
        currentStartChapter,
        currentEndChapter,
        currentStartVerse,
        currentEndVerse,
    } from '$lib/stores/bibles.store';

    export let bibles: SimpleFrontendBibleBook[];
    let searchQuery = '';

    $: filteredBibles = bibles
        .map((bible) => ({ ...bible, languageCode: lookupLanguageInfoById(bible.languageId)?.iso6393Code }))
        .filter(
            ({ abbreviation, name, languageCode }) =>
                languageCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort(
            (first, second) =>
                (first.languageCode?.localeCompare(second.languageCode ?? '') ?? 0) +
                first.name.localeCompare(second.name)
        );
    $: selectedBibleIdsInCurrentLanguage = bibles
        .filter(({ languageId, id }) => languageId === $currentLanguageInfo?.id && $preferredBibleIds.includes(id))
        .map(({ id }) => id);

    async function updatePreferredBibleIds(id: number, event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked;
        preferredBibleIds.update((ids) => {
            if (checked && !ids.includes(id)) {
                return ids.concat([id]);
            } else if (!checked && ids.includes(id)) {
                return ids.filter((existingId) => existingId !== id);
            }
            return ids;
        });

        if (checked) {
            const params = [`bookNumber=${$currentBookNumber}`];
            let data: ApiBibleContents = await getBibleTextByParams(id, params);
            data.chapters = filterBookByRange(
                data.chapters,
                $currentStartChapter,
                $currentEndChapter,
                $currentStartVerse,
                $currentEndVerse
            );
            $bibleDataFetchedByUser = [...$bibleDataFetchedByUser, data];
        } else if (!checked) {
            $bibleDataFetchedByUser = $bibleDataFetchedByUser.filter((bibleData) => bibleData.bibleId !== id);
        }
    }
</script>

<div class="flex flex-col space-y-2 p-2">
    <SearchInput bind:searchQuery />
    {#each filteredBibles as bible}
        <label class="label mb-4 cursor-pointer justify-start">
            <input
                type="checkbox"
                disabled={$preferredBibleIds.includes(bible.id) &&
                    selectedBibleIdsInCurrentLanguage.length === 1 &&
                    bible.defaultForCurrentLanguage}
                checked={$preferredBibleIds.includes(bible.id)}
                on:change={(event) => updatePreferredBibleIds(bible.id, event)}
                class="checkbox-primary checkbox"
            />
            <span class="label-text ms-4">{bible.languageCode} - {bible.name} ({bible.abbreviation})</span>
        </label>
    {/each}
</div>
