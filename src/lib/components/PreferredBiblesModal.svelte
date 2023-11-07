<script lang="ts">
    import type { FrontendBibleBook } from '$lib/types/bible-text-content';
    import SearchInput from './SearchInput.svelte';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
    import { currentLanguageInfo, lookupLanguageInfoById } from '$lib/stores/current-language.store';

    export let bibles: FrontendBibleBook[];
    let searchQuery = '';

    $: filteredBibles = bibles
        .filter(
            ({ abbreviation, name }) =>
                abbreviation.toLowerCase().includes(searchQuery) || name.toLowerCase().includes(searchQuery)
        )
        .map((bible) => ({ ...bible, languageCode: lookupLanguageInfoById(bible.languageId)?.iso6393Code }))
        .sort(
            (first, second) =>
                (first.languageCode?.localeCompare(second.languageCode ?? '') ?? 0) +
                first.name.localeCompare(second.name)
        );
    $: selectedBibleIdsInCurrentLanguage = bibles
        .filter(({ languageId, id }) => languageId === $currentLanguageInfo?.id && $preferredBibleIds.includes(id))
        .map(({ id }) => id);

    function updatePreferredBibleIds(id: number, event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked;
        preferredBibleIds.update((ids) => {
            if (checked && !ids.includes(id)) {
                return ids.concat([id]);
            } else if (!checked && ids.includes(id)) {
                return ids.filter((existingId) => existingId !== id);
            }
            return ids;
        });
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
            <span class="label-text ml-4">{bible.languageCode} - {bible.name} ({bible.abbreviation})</span>
        </label>
    {/each}
</div>
