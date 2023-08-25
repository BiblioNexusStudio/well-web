<script lang="ts">
    import { currentLanguageId } from '$lib/stores/current-language.store';
    import { _ as translate } from 'svelte-i18n';
    import { addFrontEndDataToBibleData, addFrontEndDataToPassageData } from '$lib/utils/file-manager';
    import InfoBox from '$lib/components/file-manager/InfoBox.svelte';
    import AvailableResourceSelect from '$lib/components/file-manager/AvailableResourceSelect.svelte';
    import LanguageSelect from '$lib/components/file-manager/LanguageSelect.svelte';
    import Footer from '$lib/components/file-manager/Footer.svelte';
    import Table from '$lib/components/file-manager/Table.svelte';
    import FmModal from '$lib/components/file-manager/FmModal.svelte';
    import {
        fileManagerLoading,
        bibleData,
        currentBibleVersion,
        passageData,
        tableType,
    } from '$lib/stores/file-manager.store';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { MetaTags } from 'svelte-meta-tags';

    $: infoBoxConditionsMet =
        $fileManagerLoading ||
        (!$fileManagerLoading && !$bibleData.length && !$passageData.length && $currentLanguageId);

    async function fetchAvailableResources(currentLanguageId: number | undefined) {
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
                    await fetchFromCacheOrApi(`passages/resources/language/${currentLanguageId}`)
                ).filter(({ resources }) => resources.some(({ content }) => !!content))
            );
            $fileManagerLoading = false;
        }
    }

    $: fetchAvailableResources($currentLanguageId);
</script>

<div class="container mx-auto">
    <FmModal />
    <div class="flex flex-col sm:flex-row mx-2 mx-4 my-6 sm:mx-0 justify-between items-center">
        <h1 class="text-2xl mb-4 sm:mb-0">
            {$translate('page.fileManager.title.value')}
        </h1>
        <LanguageSelect />
    </div>

    <div class="divider" />

    {#if !$fileManagerLoading && ($bibleData.length || $passageData.length)}
        <div class="flex flex-col sm:flex-row mx-2 mx-4 sm:mx-0 justify-end items-center">
            <AvailableResourceSelect />
        </div>

        <div class="divider" />
    {/if}
    <div class="overflow-x-auto mb-20">
        {#if infoBoxConditionsMet}
            <InfoBox />
        {:else if (($bibleData.length && $currentBibleVersion.contents.length) || $passageData.length) && !$fileManagerLoading}
            <Table />
        {/if}
    </div>
    <Footer />
</div>

<MetaTags description={$translate('page.fileManager.metaData.description.value')} />
