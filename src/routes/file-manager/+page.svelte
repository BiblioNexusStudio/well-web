<script lang="ts">
    import { currentLanguage, currentLanguageId } from '$lib/stores/current-language.store';
    import { _ as translate } from 'svelte-i18n';
    import { addFrontEndDataToBibleData, addFrontEndDataToPassageData } from '$lib/utils/fileManager';
    import InfoBox from '$lib/components/file-manager/InfoBox.svelte';
    import AvailableResourceSelect from '$lib/components/file-manager/AvailableResourceSelect.svelte';
    import LanguageSelect from '$lib/components/file-manager/LanguageSelect.svelte';
    import Footer from '$lib/components/file-manager/Footer.svelte';
    import Table from '$lib/components/file-manager/Table.svelte';
    import FmModal from '$lib/components/file-manager/FmModal.svelte';
    import { fileManagerLoading, bibleData, currentBibleVersion, passageData } from '$lib/stores/file-manager.store';
    import { fetchFromCacheOrApi } from '$lib/data-cache';

    $: infoBoxConditionsMet =
        $fileManagerLoading ||
        ($bibleData.length === 0 && $currentLanguage.length > 0 && !$fileManagerLoading) ||
        ($bibleData.length === 0 && $currentLanguage.length === 0 && !$fileManagerLoading);

    async function fetchAvailableResources(currentLanguageId: number | undefined) {
        if (currentLanguageId) {
            $fileManagerLoading = true;
            $bibleData = await fetchFromCacheOrApi(`bibles/language/${currentLanguageId}`);
            if ($bibleData[0]) {
                $currentBibleVersion = $bibleData[0];
            }
            $passageData = await fetchFromCacheOrApi(`passages/resources/language/${currentLanguageId}`);
            addFrontEndDataToBibleData();
            addFrontEndDataToPassageData();
            $fileManagerLoading = false;
        }
    }

    $: fetchAvailableResources($currentLanguageId);
</script>

<div class="container mx-auto">
    <FmModal />
    <div class="flex flex-col sm:flex-row mx-2 mx-4 my-6 sm:mx-0 justify-between items-center">
        <h1 class="text-2xl mb-4 sm:mb-0">
            {$translate('page.index.fileManager.value')}
        </h1>
        <LanguageSelect />
    </div>

    <div class="divider" />

    {#if $bibleData?.length > 0}
        <div class="flex flex-col sm:flex-row mx-2 mx-4 sm:mx-0 justify-end items-center">
            <AvailableResourceSelect />
        </div>

        <div class="divider" />
    {/if}
    <div class="overflow-x-auto mb-20">
        {#if infoBoxConditionsMet}
            <InfoBox />
        {:else if $bibleData.length > 0 && $currentBibleVersion.contents.length > 0 && !$fileManagerLoading}
            <Table />
        {/if}
    </div>
    <Footer />
</div>
