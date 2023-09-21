<script lang="ts">
    import { currentLanguageInfo } from '$lib/stores/current-language.store';
    import { _ as translate } from 'svelte-i18n';
    import {
        addFrontEndDataToBibleData,
        addFrontEndDataToPassageData,
        resetOriginalData,
    } from '$lib/utils/file-manager';
    import InfoBox from '$lib/components/file-manager/InfoBox.svelte';
    import AvailableResourceSelect from '$lib/components/file-manager/AvailableResourceSelect.svelte';
    import LanguageSelect from '$lib/components/file-manager/LanguageSelect.svelte';
    import Footer from '$lib/components/file-manager/Footer.svelte';
    import Table from '$lib/components/file-manager/Table.svelte';
    import FmModal from '$lib/components/file-manager/FmModal.svelte';
    import { fileManagerLoading, bibleData, currentBibleVersion, passageData } from '$lib/stores/file-manager.store';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { MetaTags } from 'svelte-meta-tags';
    import type { ApiPassage } from '$lib/types/file-manager';
    import TopNavBar from '$lib/components/TopNavBar.svelte';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import Search from '$lib/components/file-manager/Search.svelte';
    import ChangeView from '$lib/components/file-manager/ChangeView.svelte';

    let fetchAvailableResourcesPromise: Promise<void> | undefined;

    $: infoBoxConditionsMet =
        $fileManagerLoading ||
        (!$fileManagerLoading && !$bibleData.length && !$passageData.length && $currentLanguageInfo);

    async function fetchAvailableResources(currentLanguageId: number | undefined) {
        fetchAvailableResourcesPromise = (async () => {
            if (currentLanguageId) {
                $fileManagerLoading = true;
                $bibleData = await addFrontEndDataToBibleData(
                    await fetchFromCacheOrApi(`bibles/language/${currentLanguageId}`)
                );
                if ($bibleData.length > 0) {
                    $currentBibleVersion = $bibleData[0];
                }
                $passageData = await addFrontEndDataToPassageData(
                    (
                        (await fetchFromCacheOrApi(`passages/resources/language/${currentLanguageId}`)) as ApiPassage[]
                    ).filter(({ resources }) => resources.some(({ content }) => !!content))
                );
                resetOriginalData();
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

        <div class="flex mx-4 my-6 justify-between items-center">
            <Search />
            <ChangeView />
        </div>

        <div class="overflow-x-auto pb-32">
            {#if infoBoxConditionsMet}
                <InfoBox />
            {:else if (($bibleData.length && $currentBibleVersion.contents.length) || $passageData.length) && !$fileManagerLoading}
                <Table />
            {/if}
        </div>
    {:catch}
        <ErrorMessage />
    {/await}
    <Footer />
</div>

<MetaTags description={$translate('page.fileManager.metaData.description.value')} robots="noindex" />
