<script lang="ts">
    import { locale } from 'svelte-i18n';
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import arrowRight from 'svelte-awesome/icons/arrowRight';
    import { currentLanguage } from '$lib/stores/current-language.store';
    import { passageToReference, passageTypeToString } from '$lib/utils/passage-helpers';
    import { selectedId, languageSelected, selectedBookIndex, data } from '$lib/stores/passage-form.store';

    export let isSideMenu: boolean = false;

    let onLanguageSelected = (event: Event) => {
        const { value } = event.target as HTMLSelectElement;
        $languageSelected = true;
        $locale = value;
        $currentLanguage = value;
    };

    $: selectedBookInfo = $data.passagesByBook?.[$selectedBookIndex];
</script>

<form action="/passage/{$selectedId}" class="form-control w-full space-y-4 max-w-xs mx-auto">
    {#if !isSideMenu}
        <select on:change={onLanguageSelected} bind:value={$currentLanguage} class="select select-info">
            <option value="" disabled selected>{$translate('page.index.language.value')}</option>
            <option value="eng">English</option>
            <option value="tpi">Tok Pisin</option>
        </select>
    {/if}

    {#if isSideMenu}
        <label class="label p-0">
            <span class="label-text text-primary bold">{$translate('page.index.book.value')}</span>
        </label>
    {/if}
    <select
        bind:value={$selectedBookIndex}
        on:change={() => ($selectedId = 'default')}
        class="select select-info"
        disabled={!$languageSelected || !$data.passagesByBook?.length}
    >
        <option disabled selected value="default">{$translate('page.index.book.value')}</option>
        {#if $data.passagesByBook}
            {#each $data.passagesByBook as book, index}
                <option value={index}>{book.displayName}</option>
            {/each}
        {/if}
    </select>

    {#if isSideMenu}
        <label class="label p-0">
            <span class="label-text text-primary bold">{$translate('page.index.passage.value')}</span>
        </label>
    {/if}
    <select bind:value={$selectedId} class="select select-info" disabled={!selectedBookInfo}>
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

    {#if isSideMenu}
        <a href="/" class="text-primary">{$translate('sideMenu.changeLanguage.value')}</a>
    {/if}

    <button class={isSideMenu ? 'btn btn-primary w-1/3' : 'btn btn-primary'} disabled={$selectedId === 'default'}
        >{$translate('page.index.go.value')}
        {#if isSideMenu}<Icon data={arrowRight} />{/if}</button
    >
</form>
