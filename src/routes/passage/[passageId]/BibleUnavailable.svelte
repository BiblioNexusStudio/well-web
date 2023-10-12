<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { currentLanguageInfo } from '$lib/stores/current-language.store';
    import { supportedLanguages } from '$lib/utils/language-utils';
    import { asyncFilter, asyncReduce } from '$lib/utils/async-array';
    import {
        fetchBibleDataForBookCodeAndBibleId,
        fetchBiblesForLanguageCode,
        isContentCachedForPassageInBible,
    } from '$lib/utils/data-handlers/bible';
    import { isOnline } from '$lib/stores/is-online.store';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import type { ApiBible, BibleBookContentDetails } from '$lib/types/bible-text-content';
    import type { BasePassage } from '$lib/types/passage';

    interface BibleWithLanguage extends ApiBible {
        languageLabel: string;
    }

    export let passage: BasePassage;

    let selectedBible = 0;
    let availableBibles: BibleWithLanguage[] | null = null;

    function goToBibleLanguage() {
        const newUrl = new URL($page.url);
        newUrl?.searchParams?.set('bibleId', selectedBible.toString());
        goto(newUrl);
    }

    async function determineAvailableBibles(passage: BasePassage, isOnline: boolean) {
        availableBibles = await asyncReduce(
            supportedLanguages,
            async (acc: BibleWithLanguage[], language) => {
                const bibles = await fetchBiblesForLanguageCode(language.code);
                const filteredBibles = await asyncFilter(bibles, async (bible) => {
                    let bookData: BibleBookContentDetails | null = null;
                    try {
                        bookData = await fetchBibleDataForBookCodeAndBibleId(passage.bookCode, bible.id);
                        if (!bookData) {
                            return false;
                        }
                        return isOnline || (await isContentCachedForPassageInBible(passage, bookData));
                    } catch (e) {
                        return false;
                    }
                });
                return acc.concat(
                    filteredBibles.map((bible) => ({
                        ...bible,
                        languageLabel: language.label,
                    }))
                );
            },
            []
        );
    }

    $: determineAvailableBibles(passage, $isOnline);
</script>

{#if !availableBibles}
    <FullPageSpinner />
{:else}
    <div class="prose mx-auto flex h-full flex-col items-center py-4">
        <div class="flex-1" />
        <div class="flex flex-col items-center space-y-2">
            <div class="font-bold">{$translate('page.passage.noBibleContent.header.value')}</div>
            {#if availableBibles.length}
                <div class="text-center">
                    {@html $translate('page.passage.noBibleContent.description.value', {
                        values: { language: $currentLanguageInfo?.label },
                    })}
                </div>
                <select
                    bind:value={selectedBible}
                    class="select select-info {selectedBible ? 'text-primary' : 'text-base-500'} text-ellipsis"
                >
                    <option disabled value={0}>
                        {$translate('page.passage.noBibleContent.bible.value')}
                    </option>
                    {#each availableBibles as bible}
                        <option value={bible.id}>{bible.languageLabel} - {bible.abbreviation}</option>
                    {/each}
                </select>
                <button class="btn btn-primary w-1/4" disabled={!selectedBible} on:click={goToBibleLanguage}
                    >{$translate('page.passage.noBibleContent.show.value')}</button
                >
            {:else}
                <div class="text-center">
                    {@html $translate('page.passage.noBibleContent.noneAvailableDescription.value', {
                        values: { language: $currentLanguageInfo?.label },
                    })}
                </div>
            {/if}
        </div>
        <div class="flex-1" />
        {#if $isOnline}
            <a class="semi-bold text-primary" href="/file-manager"
                >{$translate('page.passage.noBibleContent.checkForMoreResources.value')}</a
            >
        {/if}
    </div>
{/if}
