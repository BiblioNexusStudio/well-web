<script lang="ts">
    import { currentLanguageInfo } from '$lib/stores/current-language.store';
    import { _ as translate } from 'svelte-i18n';
    import AvailableResourceSelect from '$lib/components/file-manager/AvailableResourceSelect.svelte';
    import LanguageSelect from '$lib/components/file-manager/LanguageSelect.svelte';
    import Footer from '$lib/components/file-manager/Footer.svelte';
    import Table from '$lib/components/file-manager/Table.svelte';
    import FmModal from '$lib/components/file-manager/FmModal.svelte';
    import {
        fileManagerLoading,
        bibleData,
        passageData,
        selectedBookCode,
        biblesModuleData,
        biblesModuleBook,
    } from '$lib/stores/file-manager.store';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { MetaTags } from 'svelte-meta-tags';
    import TopNavBar from '$lib/components/TopNavBar.svelte';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import ResouceMenu from '$lib/components/file-manager/ResourceMenu.svelte';
    import LanguageMenu from '$lib/components/file-manager/LanguageMenu.svelte';
    import { featureFlags } from '$lib/stores/feature-flags.store';
    import SelectBookMenu from '$lib/components/file-manager/SelectBookMenu.svelte';
    import { addFrontEndDataToBiblesModuleBook } from '$lib/utils/file-manager';

    let fetchAvailableResourcesPromise: Promise<void> | undefined;

    async function fetchAvailableResources(currentLanguageId: number | undefined) {
        fetchAvailableResourcesPromise = (async () => {
            if (currentLanguageId) {
                $fileManagerLoading = true;
                $biblesModuleData = await fetchFromCacheOrApi(`bibles/language/${currentLanguageId}`);

                if ($selectedBookCode) {
                    const firstBible = $biblesModuleData[0] || { id: null };
                    $biblesModuleBook = addFrontEndDataToBiblesModuleBook(
                        await fetchFromCacheOrApi(`bibles/${firstBible.id}/book/${$selectedBookCode}`)
                    );
                }

                $fileManagerLoading = false;
            }
        })();
    }

    $: fetchAvailableResources($currentLanguageInfo?.id);
</script>

<div class="container mx-auto pt-12 w-full h-full">
    <FmModal />
    <TopNavBar title={$translate('page.fileManager.title.value')} />
    {#await fetchAvailableResourcesPromise}
        <FullPageSpinner />
    {:then}
        {#if !$featureFlags.newFileManager}
            <div class="flex flex-col sm:flex-row mx-2 mx-4 my-6 sm:mx-0 justify-between items-center">
                <LanguageSelect />
            </div>

            <div class="divider" />

            {#if !$fileManagerLoading && ($bibleData.length || $passageData.length)}
                <div class="flex flex-col sm:flex-row mx-2 mx-4 sm:mx-0 justify-end items-center">
                    <AvailableResourceSelect />
                </div>

                <div class="divider" />
            {/if}
        {/if}

        {#if $featureFlags.newFileManager}
            <div class="flex mx-4 mt-6 mb-4 justify-between items-center">
                <SelectBookMenu />
            </div>
            {#if $selectedBookCode}
                <div class="flex mx-4 my-4 justify-between items-center">
                    <ResouceMenu />
                    <LanguageMenu />
                </div>
            {/if}
        {/if}

        <div class="overflow-x-auto pb-32">
            <Table />
        </div>
    {:catch}
        <ErrorMessage />
    {/await}
    {#if $selectedBookCode}
        <Footer />
    {/if}
</div>

<MetaTags description={$translate('page.fileManager.metaData.description.value')} robots="noindex" />
