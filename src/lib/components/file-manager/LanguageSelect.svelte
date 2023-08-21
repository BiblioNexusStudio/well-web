<script lang="ts">
    import { locale } from 'svelte-i18n';
    import { _ as translate } from 'svelte-i18n';
    import { language } from '$lib/stores/language.store';
    import type { language as languageType } from '$lib/types/fileManager';
    import { addFrontEndDataToBibleData } from '$lib/utils/fileManager';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { fileManagerLoading, bibleData, currentBibleBook, languages } from '$lib/stores/file-manager.store';

    const onLanguageSelected = async (e: any) => {
        $locale = e.target.value;
        $language = e.target.value;
        $fileManagerLoading = true;

        const { id } = $languages.find((l: languageType) => l.iso6393Code === $language);

        $bibleData = await fetchFromCacheOrApi(`bibles/language/${id}`);
        if ($bibleData.length > 0) {
            $currentBibleBook = $bibleData[0];
        }
        addFrontEndDataToBibleData();
        $fileManagerLoading = false;
    };
</script>

<select class="select select-primary w-full max-w-xs" on:change={onLanguageSelected} bind:value={$language}>
    <option value="" disabled selected>{$translate('page.index.language.value')}</option>
    {#each $languages as language}
        <option value={language.iso6393Code}>{language.englishDisplay}</option>
    {/each}
</select>
