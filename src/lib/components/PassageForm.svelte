<script lang="ts">
    import { locale } from 'svelte-i18n';
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import { isOnline } from '$lib/stores/is-online.store';
    import arrowRight from 'svelte-awesome/icons/arrowRight';
    import { currentLanguage } from '$lib/stores/current-language.store';
    import { fetchData } from '$lib/utils/data-handlers/resources/passages';
    import { passageToReference, passageTypeToString } from '$lib/utils/passage-helpers';
    import { selectedId, languageSelected, selectedBookIndex, data } from '$lib/stores/passage-form.store';
    import { onMount } from 'svelte';

    export let isSideMenu = false;

    let onLanguageSelected = (event: Event) => {
        const { value } = event.target as HTMLSelectElement;
        $languageSelected = true;
        $locale = value;
        $currentLanguage = value;
    };

    const closeSideMenu = () => {
        if (isSideMenu) {
            const sideMenu = document.getElementById('top-navbar-drawer') as HTMLDivElement;
            if (sideMenu) {
                sideMenu.click();
            }
        }
    };

    $: $currentLanguage && fetchData($isOnline);
    $: selectedBookInfo = $data.passagesByBook?.[$selectedBookIndex];

    onMount(() => {
        if ($currentLanguage) {
            $languageSelected = true;
        }
        fetchData($isOnline);
    });
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
        <label class="label p-0" for="passage-form-book">
            <span class="label-text text-primary bold">{$translate('page.index.book.value')}</span>
        </label>
    {/if}
    <select
        id="passage-form-book"
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
        <a href="/" class="text-primary">{$translate('sideMenu.changeLanguage.value')}</a>
    {/if}

    <button
        class="btn btn-primary {isSideMenu ? 'w-1/3' : ''}"
        disabled={$selectedId === 'default'}
        on:click={closeSideMenu}
        >{$translate('page.index.go.value')}
        {#if isSideMenu}<Icon data={arrowRight} />{/if}</button
    >
</form>
