<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { locale } from 'svelte-i18n';
    import { selectedId, languageSelected, selectedBookIndex, data } from '$lib/stores/passage-form.store';
    import { currentLanguage, currentLanguageId } from '$lib/stores/current-language.store';
    import { passageToReference, passageTypeToString } from '$lib/utils/passage-helpers';

    let onLanguageSelected = (event: Event) => {
        const { value } = event.target as HTMLSelectElement;
        $languageSelected = true;
        $locale = value;
        $currentLanguage = value;
    };

    $: selectedBookInfo = $data.passagesByBook?.[$selectedBookIndex];
</script>

<form action="/passage/{$selectedId}" class="form-control w-full space-y-4 max-w-xs mx-auto">
    <select on:change={onLanguageSelected} bind:value={$currentLanguage} class="select select-primary">
        <option value="" disabled selected>{$translate('page.index.language.value')}</option>
        <option value="eng">English</option>
        <option value="tpi">Tok Pisin</option>
    </select>

    <select
        bind:value={$selectedBookIndex}
        on:change={() => ($selectedId = 'default')}
        class="select select-primary"
        disabled={!$languageSelected || !$data.passagesByBook?.length}
    >
        <option disabled selected value="default">{$translate('page.index.book.value')}</option>
        {#if $data.passagesByBook}
            {#each $data.passagesByBook as book, index}
                <option value={index}>{book.displayName}</option>
            {/each}
        {/if}
    </select>

    <select bind:value={$selectedId} class="select select-primary" disabled={!selectedBookInfo}>
        <option disabled selected value="default">{$translate('page.index.passage.value')}</option>
        {#if selectedBookInfo}
            {#each selectedBookInfo.passages as passage}
                <option value={passageTypeToString(passage)}
                    >{selectedBookInfo.displayName}
                    {passageToReference(passage)}</option
                >
            {/each}
        {/if}
    </select>

    <button class="btn btn-primary" disabled={$selectedId === 'default'}>{$translate('page.index.go.value')}</button>
</form>
