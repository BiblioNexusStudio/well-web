<script lang="ts">
    import { locale } from 'svelte-i18n';
    import { _ as translate } from 'svelte-i18n';
    import { currentLanguage } from '$lib/stores/current-language.store';
    import { languages } from '$lib/stores/file-manager.store';

    const onLanguageSelected = async (event: Event) => {
        const target = event.target as HTMLSelectElement;
        $locale = target.value;
        $currentLanguage = target.value;
    };
</script>

<select class="select select-primary w-full max-w-xs" on:change={onLanguageSelected} bind:value={$currentLanguage}>
    <option value="" disabled selected>{$translate('page.fileManager.language.value')}</option>
    {#each $languages as language}
        <option value={language.iso6393Code}>{language.englishDisplay}</option>
    {/each}
</select>
