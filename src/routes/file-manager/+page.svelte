<script lang="ts">
    import { onMount } from 'svelte';
    import { language } from '$lib/stores/language.store';
    import { _ as translate } from 'svelte-i18n';
    import type { PageData } from './$types';
    import { addFrontEndDataToBibleData, addFrontEndDataToPassageData } from '$lib/utils/fileManager';
    import InfoBox from '$lib/components/file-manager/InfoBox.svelte';
    import BibleBookSelect from '$lib/components/file-manager/BibleBookSelect.svelte';
    import LanguageSelect from '$lib/components/file-manager/LanguageSelect.svelte';
    import Footer from '$lib/components/file-manager/Footer.svelte';
    import Table from '$lib/components/file-manager/Table.svelte';
    import FmModal from '$lib/components/file-manager/FmModal.svelte';
    import {
        fileManagerLoading,
        bibleData,
        currentBibleBook,
        languages,
        passageData,
    } from '$lib/stores/file-manager.store';

    export let data: PageData;

    $: infoBoxConditionsMet =
        $fileManagerLoading ||
        ($bibleData.length === 0 && $language.length > 0 && !$fileManagerLoading) ||
        ($bibleData.length === 0 && $language.length === 0 && !$fileManagerLoading);

    onMount(() => {
        if (data.bibles) {
            $bibleData = data.bibles;
            if ($bibleData.length > 0) {
                $currentBibleBook = $bibleData[0];
            }
            addFrontEndDataToBibleData();
        }

        if (data.resources) {
            $passageData = data.resources;
            addFrontEndDataToPassageData();
        }
        if (data.languages) {
            $languages = data.languages;
        }
    });
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
            <BibleBookSelect />
        </div>

        <div class="divider" />
    {/if}
    <div class="overflow-x-auto mb-20">
        {#if infoBoxConditionsMet}
            <InfoBox />
        {:else if $bibleData.length > 0 && $currentBibleBook.contents.length > 0 && !$fileManagerLoading}
            <Table />
        {/if}
    </div>
    <Footer />
</div>
