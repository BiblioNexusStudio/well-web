<script lang="ts">
    import { locale } from 'svelte-i18n';
    import { _ as translate } from 'svelte-i18n';
    import { language } from '$lib/stores/language.store';
    import { PUBLIC_AQUIFER_API_URL } from '$env/static/public';
    import type { language as languageType } from '$lib/types/fileManager';
    import { addFrontEndDataToBibleData } from '$lib/utils/fileManager';
    import {
        fileManagerLoading,
        bibleData,
        currentBibleBook,
        languages,
    } from '$lib/stores/file-manager.store';

    const onLanguageSelected = async (e: any) => {
        $locale = e.target.value;
        $language = e.target.value;
        $fileManagerLoading = true;

        const { id } = $languages.find((l: languageType) => l.iso6393Code === $language);

        const bibleResponse = await fetch(`${PUBLIC_AQUIFER_API_URL}/bibles/language/${id}`);
        $bibleData = await bibleResponse.json();
        if ($bibleData.length > 0) {
            $currentBibleBook = $bibleData[0];
        }
        addFrontEndDataToBibleData($bibleData);
        $fileManagerLoading = false;
    };
</script>

<select
    class="select select-primary w-full max-w-xs"
    on:change={onLanguageSelected}
    bind:value={$language}
>
    <option value="" disabled selected>{$translate('page.index.language.value')}</option>
    {#each $languages as language}
        <option value={language.iso6393Code}>{language.englishDisplay}</option>
    {/each}
</select>
