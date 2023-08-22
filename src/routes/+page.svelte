<script lang="ts">
    import type { PageData } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import { locale } from 'svelte-i18n';
    import { currentLanguage } from '$lib/stores/current-language.store';
    import Icon from 'svelte-awesome';
    import gear from 'svelte-awesome/icons/gear';
    import { onMount } from 'svelte';
    import { passageToReference, passageTypeToString } from '$lib/utils/passage-helpers';

    export let data: PageData;

    let languageSelected: boolean;
    let selectedBookIndex: number;
    let selectedId = 'default';
    $: selectedBookInfo = data.passagesByBook[selectedBookIndex];

    let onLanguageSelected = (event: Event) => {
        const { value } = event.target as HTMLSelectElement;
        languageSelected = true;
        $locale = value;
        $currentLanguage = value;
    };
    onMount(() => {
        if ($currentLanguage) {
            languageSelected = true;
        }
    });
</script>

<section class="container mx-auto flex h-screen">
    <div class="flex-grow self-center">
        <h1 class="text-center font-semibold text-info text-7xl pb-6">AQUIFER</h1>
        <form action="/passage/{selectedId}" class="form-control w-full max-w-xs space-y-6 mx-auto">
            <select on:change={onLanguageSelected} bind:value={$currentLanguage} class="select select-info">
                <option value="" disabled selected>{$translate('page.index.language.value')}</option>
                <option value="eng">English</option>
                <option value="tpi">Tok Pisin</option>
            </select>

            <select
                bind:value={selectedBookIndex}
                on:change={() => (selectedId = 'default')}
                class="select select-info"
                disabled={!languageSelected}
            >
                <option disabled selected value="default">{$translate('page.index.book.value')}</option>
                {#each data.passagesByBook as book, index}
                    <option value={index}>{book.displayName}</option>
                {/each}
            </select>

            <select bind:value={selectedId} class="select select-info" disabled={!selectedBookInfo}>
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

            <button class="btn btn-info" disabled={selectedId === 'default'}>{$translate('page.index.go.value')}</button
            >
        </form>
    </div>

    <div class="flex flex-row space-x-2 fixed bottom-4 right-4">
        <a href="/file-manager" class="btn btn-info">
            <Icon class="w-6 h-6" data={gear} />
        </a>
    </div>
</section>

<style>
    @keyframes animate {
        0%,
        100% {
            clip-path: polygon(0% 45%, 16% 44%, 33% 50%, 54% 60%, 70% 61%, 84% 59%, 100% 52%, 100% 100%, 0% 100%);
        }

        50% {
            clip-path: polygon(0% 60%, 15% 65%, 34% 66%, 51% 62%, 67% 50%, 84% 45%, 100% 46%, 100% 100%, 0% 100%);
        }
    }
</style>
