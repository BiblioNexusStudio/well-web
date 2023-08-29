<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { locale } from 'svelte-i18n';
    import { currentLanguage, currentLanguageId } from '$lib/stores/current-language.store';
    import { onMount } from 'svelte';
    import { passageToReference, passageTypeToString } from '$lib/utils/passage-helpers';
    import { fetchFromCacheOrApi, isCachedFromCdn } from '$lib/data-cache';
    import type { Passages, PassagesContent } from '$lib/types/file-manager';
    import { asyncEvery, asyncFilter, asyncSome } from '$lib/utils/async-array';
    import { get } from 'svelte/store';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import { goto } from '$app/navigation';
    import { isOnline } from '$lib/stores/is-online.store';

    let languageSelected: boolean;
    let selectedBookIndex: number;
    let selectedId = 'default';
    let data = {};

    $: selectedBookInfo = data.passagesByBook?.[selectedBookIndex];

    $: $currentLanguage && fetchData();

    const goToFileManager = () => {
        goto('/file-manager');
    };

    async function getBibleBookIdsToNameAndIndex(languageId: number | null = null) {
        const bibleData = await fetchFromCacheOrApi(`bibles/language/${languageId || get(currentLanguageId)}`);
        if (bibleData[0]) {
            return bibleData[0].contents.reduce(
                (output, { displayName, bookId }, index) => ({ ...output, [bookId]: { displayName, index } }),
                {} as Record<number, { displayName: string; index: number }>
            );
        } else {
            return getBibleBookIdsToNameAndIndex(1);
        }
    }

    export async function fetchData() {
        const bibleBookIdsToNameAndIndex = await getBibleBookIdsToNameAndIndex();
        const passagesWithResources = (await fetchFromCacheOrApi(
            `passages/resources/language/${get(currentLanguageId)}`
        )) as Passages[];
        const availableOfflinePassagesWithResources = await asyncFilter(
            passagesWithResources,
            async ({ resources }) => {
                return asyncSome(resources, async ({ mediaType, content }) => {
                    if (mediaType === 1 && content) {
                        return await isCachedFromCdn((content as PassagesContent).content.url);
                    } else if (mediaType === 2 && content) {
                        return asyncEvery(
                            (content as PassagesContent).content.steps,
                            async (step) => await isCachedFromCdn(step[audioFileTypeForBrowser()].url)
                        );
                    } else {
                        return false;
                    }
                });
            }
        );
        const passagesByBook = availableOfflinePassagesWithResources
            .reduce((output, passageWithResource) => {
                const bibleBookNameAndIndex = bibleBookIdsToNameAndIndex[passageWithResource.bookId];
                output[bibleBookNameAndIndex.index] ||= {
                    displayName: bibleBookNameAndIndex.displayName,
                    passages: [],
                };
                const bookInfo = output[bibleBookNameAndIndex.index];
                bookInfo.passages.push(passageWithResource);
                return output;
            }, [])
            .filter(Boolean);
        data = { passagesByBook };
    }

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

<svelte:window bind:online={$isOnline} />

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
                {#if data.passagesByBook}
                    {#each data.passagesByBook as book, index}
                        <option value={index}>{book.displayName}</option>
                    {/each}
                {/if}
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
            {#if $isOnline}
                <button class="btn btn-info mx-auto" on:click|preventDefault={goToFileManager}
                    >{$translate('page.index.downloadResourcesForOfflineUse.value')}</button
                >
            {:else}
                <div
                    class="tooltip tooltip-bottom tooltip-info"
                    data-tip={$translate('page.index.youAreCurrentlyOffline.value')}
                >
                    <button class="btn btn-info mx-auto" disabled={!$isOnline}
                        >{$translate('page.index.downloadResourcesForOfflineUse.value')}</button
                    >
                </div>
            {/if}
        </form>
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
