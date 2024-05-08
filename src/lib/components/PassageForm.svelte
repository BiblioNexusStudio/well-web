<script lang="ts">
    import { onMount } from 'svelte';
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import { isOnline } from '$lib/stores/is-online.store';
    import arrowRight from 'svelte-awesome/icons/arrowRight';
    import { currentLanguageInfo, supportedLanguages, updateCurrentLanguageCode } from '$lib/stores/language.store';
    import { fetchCbbterPassagesByBook } from '$lib/utils/data-handlers/resources/passages';
    import { bibleSectionToReference } from '$lib/utils/bible-section-helpers';
    import { selectedBibleSection, selectedBookIndex, data } from '$lib/stores/passage-form.store';
    import type { BibleSection } from '$lib/types/passage';

    let isLoading = false;

    let onLanguageSelected = (event: Event) => {
        const { value } = event.target as HTMLSelectElement;
        $selectedBookIndex = 'default';
        updateCurrentLanguageCode(value);
    };

    $: $currentLanguageInfo && callFetchData($isOnline);
    $: selectedBookInfo = $selectedBookIndex === 'default' ? null : $data.passagesByBook?.[$selectedBookIndex];

    async function callFetchData(_isOnline: boolean = true) {
        isLoading = true;
        await fetchCbbterPassagesByBook();
        isLoading = false;
    }

    function bibleSectionToFakeId(bibleSection: BibleSection | null) {
        if (!bibleSection) return null;
        return `${bibleSection.bookCode}|${bibleSection.startChapter}|${bibleSection.startVerse}|${bibleSection.endChapter}|${bibleSection.endVerse}`;
    }

    function fakeIdToBibleSection(fakeId: string | null): BibleSection | null {
        if (!fakeId) return null;

        const [bookCode, startChapter, startVerse, endChapter, endVerse] = fakeId.split('|');

        if (!bookCode || !startChapter || !startVerse || !endChapter || !endVerse) return null;

        return {
            bookCode,
            startChapter: parseInt(startChapter, 10),
            startVerse: parseInt(startVerse, 10),
            endChapter: parseInt(endChapter, 10),
            endVerse: parseInt(endVerse, 10),
        };
    }

    function selectPassage(event: Event) {
        const selectTarget = event.target as HTMLSelectElement;
        if (selectTarget.value === '') {
            $selectedBibleSection = null;
        } else {
            $selectedBibleSection = fakeIdToBibleSection(selectTarget.value);
        }
    }

    onMount(() => callFetchData());
</script>

<form action="/passage/{$selectedBibleSection}" class="form-control mx-auto w-full max-w-xs space-y-4">
    <label class="label p-0" for="passage-form-book">
        <span class="bold label-text">{$translate('page.index.language.value')}</span>
    </label>
    <select
        on:change={onLanguageSelected}
        value={$currentLanguageInfo?.iso6393Code}
        class="select select-info pe-14 ps-4 font-semibold"
    >
        <option value="" disabled selected>{$translate('page.index.language.value')}</option>
        {#each $supportedLanguages as { iso6393Code, displayName }}
            <option value={iso6393Code}>{displayName}</option>
        {/each}
    </select>

    <label class="label p-0" for="passage-form-book">
        <span class="bold label-text">{$translate('page.index.passage.value')}</span>
    </label>
    <select
        id="passage-form-book"
        bind:value={$selectedBookIndex}
        on:change={() => ($selectedBibleSection = null)}
        class="select select-info pe-14 ps-4 font-semibold"
        disabled={!$data.passagesByBook?.length}
    >
        <option disabled selected value="default">
            {$translate('page.index.book.value')}
            {#if isLoading}
                ({$translate('page.index.loading.value')}...)
            {/if}
        </option>
        {#if $data.passagesByBook}
            {#each $data.passagesByBook as book, index}
                <option value={index}>{book.bookName}</option>
            {/each}
        {/if}
    </select>

    <select
        id="passage-form-passage"
        value={bibleSectionToFakeId($selectedBibleSection)}
        on:change={selectPassage}
        class="select select-info pe-14 ps-4 font-semibold"
        disabled={!selectedBookInfo}
    >
        <option disabled value="">{$translate('page.index.passage.value')}</option>
        {#if selectedBookInfo}
            {#each selectedBookInfo.passages as passage}
                <option value={bibleSectionToFakeId(passage)}
                    >{selectedBookInfo.bookName}
                    {bibleSectionToReference(passage)}</option
                >
            {/each}
        {/if}
    </select>

    <button class="btn btn-primary mx-auto w-1/3" disabled={$selectedBibleSection === null}
        >{$translate('page.index.go.value')} <Icon data={arrowRight} /></button
    >
</form>
