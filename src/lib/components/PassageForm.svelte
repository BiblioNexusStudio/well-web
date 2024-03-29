<script lang="ts">
    import { onMount } from 'svelte';
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import { closeSideMenu } from '$lib/utils/side-menu';
    import { isOnline } from '$lib/stores/is-online.store';
    import arrowRight from 'svelte-awesome/icons/arrowRight';
    import { currentLanguageInfo, supportedLanguages, updateCurrentLanguageCode } from '$lib/stores/language.store';
    import { fetchCbbterPassagesByBook } from '$lib/utils/data-handlers/resources/passages';
    import { passageToReference } from '$lib/utils/passage-helpers';
    import { selectedId, selectedBookIndex, data } from '$lib/stores/passage-form.store';

    export let isSideMenu = false;

    let isLoading = false;

    let onLanguageSelected = (event: Event) => {
        const { value } = event.target as HTMLSelectElement;
        $selectedBookIndex = 'default';
        updateCurrentLanguageCode(value);
    };

    $: $currentLanguageInfo && callFetchData($isOnline);
    $: selectedBookInfo = $selectedBookIndex === 'default' ? null : $data.passagesByBook?.[$selectedBookIndex];

    async function callFetchData(isOnline = true) {
        isLoading = true;
        await fetchCbbterPassagesByBook(isOnline);
        isLoading = false;
    }

    onMount(() => callFetchData());
</script>

<form action="/passage/{$selectedId}" class="form-control mx-auto w-full max-w-xs space-y-4">
    {#if !isSideMenu}
        <label class="label p-0" for="passage-form-book">
            <span class="label-text {isSideMenu ? 'text-primary' : ''} bold"
                >{$translate('page.index.language.value')}</span
            >
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
    {/if}

    <label class="label p-0" for="passage-form-book">
        <span class="label-text {isSideMenu ? 'text-primary' : ''} bold"
            >{isSideMenu ? $translate('page.index.book.value') : $translate('page.index.passage.value')}</span
        >
    </label>
    <select
        id="passage-form-book"
        bind:value={$selectedBookIndex}
        on:change={() => ($selectedId = 'default')}
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

    {#if isSideMenu}
        <label class="label p-0" for="passage-form-passage">
            <span class="bold label-text text-primary">{$translate('page.index.passage.value')}</span>
        </label>
    {/if}
    <select
        id="passage-form-passage"
        bind:value={$selectedId}
        class="select select-info pe-14 ps-4 font-semibold"
        disabled={!selectedBookInfo}
    >
        <option disabled selected value="default">{$translate('page.index.passage.value')}</option>
        {#if selectedBookInfo}
            {#each selectedBookInfo.passages as passage}
                <option value={passage.id}
                    >{selectedBookInfo.bookName}
                    {passageToReference(passage)}</option
                >
            {/each}
        {/if}
    </select>

    {#if isSideMenu}
        <a href="/" on:click={closeSideMenu} class="text-primary">{$translate('sideMenu.changeLanguage.value')}</a>
    {/if}

    <button
        class="btn btn-primary w-1/3 {isSideMenu ? '' : 'mx-auto'}"
        disabled={$selectedId === 'default'}
        on:click={closeSideMenu}>{$translate('page.index.go.value')} <Icon data={arrowRight} /></button
    >
</form>
