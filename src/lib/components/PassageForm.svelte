<script lang="ts">
    import { onMount } from 'svelte';
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import { closeSideMenu } from '$lib/utils/side-menu';
    import { isOnline } from '$lib/stores/is-online.store';
    import arrowRight from 'svelte-awesome/icons/arrowRight';
    import { currentLanguageCode } from '$lib/stores/current-language.store';
    import { fetchData } from '$lib/utils/data-handlers/resources/passages';
    import { passageToReference, passageTypeToString } from '$lib/utils/passage-helpers';
    import { selectedId, selectedBookIndex, data } from '$lib/stores/passage-form.store';
    import { supportedLanguages } from '$lib/utils/language-utils';

    export let isSideMenu = false;

    let isLoading = false;

    let onLanguageSelected = (event: Event) => {
        const { value } = event.target as HTMLSelectElement;
        $currentLanguageCode = value;
    };

    $: $currentLanguageCode && callFetchData($isOnline);
    $: selectedBookInfo = $selectedBookIndex === 'default' ? null : $data.passagesByBook?.[$selectedBookIndex];

    async function callFetchData(isOnline = true) {
        isLoading = true;
        await fetchData(isOnline);
        isLoading = false;
    }

    onMount(() => callFetchData());
</script>

<form action="/passage/{$selectedId}" class="form-control w-full space-y-4 max-w-xs mx-auto">
    {#if !isSideMenu}
        <label class="label p-0" for="passage-form-book">
            <span class="label-text {isSideMenu ? 'text-primary' : ''} bold"
                >{$translate('page.index.language.value')}</span
            >
        </label>
        <select on:change={onLanguageSelected} bind:value={$currentLanguageCode} class="select select-info">
            <option value="" disabled selected>{$translate('page.index.language.value')}</option>
            {#each supportedLanguages as { code, label }}
                <option value={code}>{label}</option>
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
        class="select select-info"
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
                <option value={index}>{book.displayName}</option>
            {/each}
        {/if}
    </select>

    {#if isSideMenu}
        <label class="label p-0" for="passage-form-passage">
            <span class="label-text text-primary bold">{$translate('page.index.passage.value')}</span>
        </label>
    {/if}
    <select id="passage-form-passage" bind:value={$selectedId} class="select select-info" disabled={!selectedBookInfo}>
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
        <a href="/" on:click={closeSideMenu} class="text-primary">{$translate('sideMenu.changeLanguage.value')}</a>
    {/if}

    <button
        class="btn btn-primary w-1/3 {isSideMenu ? '' : 'mx-auto'}"
        disabled={$selectedId === 'default'}
        on:click={closeSideMenu}>{$translate('page.index.go.value')} <Icon data={arrowRight} /></button
    >
</form>
