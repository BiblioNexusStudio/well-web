<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { lookupLanguageInfoByCode, lookupLanguageInfoById } from '$lib/stores/current-language.store';
    import { supportedLanguages } from '$lib/utils/language-utils';
    import { asyncFilter, asyncReduce } from '$lib/utils/async-array';
    import { fetchBibleDataForLanguageCode, isContentCachedForPassageInBible } from '$lib/utils/data-handlers/bible';
    import type { ApiBibleVersion, BasePassage, Language } from '$lib/types/file-manager';
    import { isOnline } from '$lib/stores/is-online.store';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';

    interface BibleVersionWithLanguage extends ApiBibleVersion {
        languageInfo: (Language & { label: string | undefined }) | null;
    }

    export let passage: BasePassage;
    export let bibleLanguageCode: string;

    let selectedBible = '';
    let availableBibles: BibleVersionWithLanguage[] | null = null;

    $: currentBibleLanguageLabel = lookupLanguageInfoByCode(bibleLanguageCode)?.label;

    function goToBibleLanguage() {
        const newUrl = new URL($page.url);
        newUrl?.searchParams?.set('bibleLanguage', selectedBible);
        goto(newUrl);
    }

    async function determineAvailableBibles(passage: BasePassage, isOnline: boolean) {
        availableBibles = await asyncReduce(
            supportedLanguages,
            async (acc: BibleVersionWithLanguage[], language) => {
                let bibleVersions: ApiBibleVersion[];
                try {
                    bibleVersions = await fetchBibleDataForLanguageCode(language.code);
                } catch (e) {
                    bibleVersions = [];
                }
                if (!isOnline) {
                    bibleVersions = await asyncFilter(
                        bibleVersions,
                        async (version) => await isContentCachedForPassageInBible(passage, version)
                    );
                }
                return acc.concat(
                    bibleVersions
                        .map((bibleVersion) => ({
                            ...bibleVersion,
                            languageInfo: lookupLanguageInfoById(bibleVersion.languageId),
                        }))
                        .slice(0, 1)
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
    <div class="flex flex-col items-center py-4 prose mx-auto h-full">
        <div class="flex-1" />
        <div class="flex flex-col space-y-2 items-center">
            <div class="font-bold">{$translate('page.passage.noBibleContent.header.value')}</div>
            {#if availableBibles.length}
                <div class="text-center">
                    {@html $translate('page.passage.noBibleContent.description.value', {
                        values: { language: currentBibleLanguageLabel },
                    })}
                </div>
                <select
                    bind:value={selectedBible}
                    class="select select-info {selectedBible ? 'text-primary' : 'text-base-500'} text-ellipsis"
                >
                    <option disabled value="">
                        {$translate('page.passage.noBibleContent.bible.value')}
                    </option>
                    {#each availableBibles as bible}
                        <option value={bible.languageInfo?.iso6393Code}
                            >{bible.languageInfo?.label} - {bible.name}</option
                        >
                    {/each}
                </select>
                <button class="btn btn-primary w-1/4" disabled={!selectedBible} on:click={goToBibleLanguage}
                    >{$translate('page.passage.noBibleContent.show.value')}</button
                >
            {:else}
                <div class="text-center">
                    {@html $translate('page.passage.noBibleContent.noneAvailableDescription.value', {
                        values: { language: currentBibleLanguageLabel },
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
