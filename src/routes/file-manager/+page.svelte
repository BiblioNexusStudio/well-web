<script lang="ts">
    import { currentLanguageInfo } from '$lib/stores/current-language.store';
    import { _ as translate } from 'svelte-i18n';
    import Footer from '$lib/components/file-manager/Footer.svelte';
    import ViewTable from '$lib/components/file-manager/ViewTable.svelte';
    import FmModal from '$lib/components/file-manager/FmModal.svelte';
    import {
        fileManagerLoading,
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
    import SelectBookMenu from '$lib/components/file-manager/SelectBookMenu.svelte';
    import { addFrontEndDataToBiblesModuleBook } from '$lib/utils/file-manager';

    let fetchAvailableResourcesPromise: Promise<void> | undefined;

    async function fetchAvailableResources(currentLanguageId: number | undefined) {
        fetchAvailableResourcesPromise = (async () => {
            if (currentLanguageId) {
                $fileManagerLoading = true;

                $biblesModuleData = await fetchFromCacheOrApi(`bibles/language/${currentLanguageId}`);

                if ($biblesModuleData.length === 0) {
                    $biblesModuleData = await fetchFromCacheOrApi(`bibles/language/1`);
                }

                if ($selectedBookCode) {
                    const firstBible = $biblesModuleData[0] || { id: null };
                    $biblesModuleBook = await addFrontEndDataToBiblesModuleBook(
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
        <div class="flex mx-4 mt-6 mb-4 justify-between items-center">
            <SelectBookMenu />
        </div>
        {#if $selectedBookCode}
            <div class="flex mx-4 my-4 justify-between items-center">
                <ResouceMenu />
                <LanguageMenu />
            </div>
            <div class="overflow-x-auto pb-32">
                <ViewTable />
            </div>
        {/if}
    {:catch}
        <ErrorMessage />
    {/await}
    {#if $selectedBookCode}
        <Footer />
    {/if}
</div>

<MetaTags description={$translate('page.fileManager.metaData.description.value')} robots="noindex" />
