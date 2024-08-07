<script lang="ts">
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import { _ as translate } from 'svelte-i18n';
    import Footer from '$lib/components/file-manager/Footer.svelte';
    import ViewTable from '$lib/components/file-manager/ViewTable.svelte';
    import FmModal from '$lib/components/file-manager/FmModal.svelte';
    import DeleteModal from '$lib/components/file-manager/DeleteModal.svelte';
    import {
        isLoadingBibles,
        isLoadingParentResources,
        isLoadingLanguageFirstBible,
        isLoadingResources,
        selectedBookCode,
        biblesModuleData,
        biblesModuleBook,
    } from '$lib/stores/file-manager.store';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { MetaTags } from 'svelte-meta-tags';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import ResourceMenu from '$lib/components/file-manager/ResourceMenu.svelte';
    import LanguageMenu from '$lib/components/file-manager/LanguageMenu.svelte';
    import SelectBookMenu from '$lib/components/file-manager/SelectBookMenu.svelte';
    import { addFrontEndDataToBiblesModuleBook } from '$lib/utils/file-manager';
    import { biblesForLanguageEndpoint, bookOfBibleEndpoint } from '$lib/api-endpoints';
    import HomeIcon from '$lib/icons/HomeIcon.svelte';

    let fetchAvailableResourcesPromise: Promise<void> | undefined;

    async function fetchAvailableResources(currentLanguageId: number | undefined) {
        fetchAvailableResourcesPromise = (async () => {
            if (currentLanguageId) {
                $isLoadingBibles = true;

                $biblesModuleData = await fetchFromCacheOrApi(...biblesForLanguageEndpoint(currentLanguageId));

                if ($biblesModuleData.length === 0) {
                    $biblesModuleData = await fetchFromCacheOrApi(...biblesForLanguageEndpoint(1));
                }

                if ($selectedBookCode) {
                    const firstBible = $biblesModuleData[0] || { id: null };
                    $biblesModuleBook = await addFrontEndDataToBiblesModuleBook(
                        firstBible.id,
                        await fetchFromCacheOrApi(...bookOfBibleEndpoint(firstBible.id, $selectedBookCode))
                    );
                    $biblesModuleBook.bibleId = firstBible.id;
                }

                $isLoadingBibles = false;
            }
        })();
    }

    $: fetchAvailableResources($currentLanguageInfo?.id);
</script>

<div class="container mx-auto h-full w-full pt-4">
    <FmModal />
    <DeleteModal />
    <div class="mx-4 flex justify-between">
        <h1 class="semi-bold line-clamp-1 flex-1 break-all text-lg">
            {$translate('page.fileManager.downloadManager.value')}
        </h1>
        <a href="/" data-app-insights-event-name="download-manager-home-icon-clicked"><HomeIcon /></a>
    </div>
    {#await fetchAvailableResourcesPromise}
        <FullPageSpinner />
    {:then}
        {#if $isLoadingBibles}
            <FullPageSpinner />
        {:else}
            <div class="mx-4 mb-4 mt-6 flex items-center justify-between">
                <SelectBookMenu />
            </div>
            {#if $selectedBookCode}
                {#if $isLoadingParentResources || $isLoadingLanguageFirstBible}
                    <FullPageSpinner height="h-[calc(100vh-20rem)]" />
                {/if}
                <div
                    class="mx-4 my-4 flex items-center justify-between {($isLoadingParentResources ||
                        $isLoadingLanguageFirstBible) &&
                        'hidden'}"
                >
                    <ResourceMenu />
                    <LanguageMenu />
                </div>
                {#if $isLoadingResources}
                    <FullPageSpinner height="h-[calc(100vh-20rem)]" />
                {/if}
                <div class="overflow-x-auto pb-32 {$isLoadingResources && 'hidden'}">
                    <ViewTable />
                </div>
            {/if}
        {/if}
    {:catch}
        <ErrorMessage />
    {/await}
    {#if $selectedBookCode}
        <Footer />
    {/if}
</div>

<MetaTags description={$translate('page.fileManager.metaData.description.value')} robots="noindex" />
