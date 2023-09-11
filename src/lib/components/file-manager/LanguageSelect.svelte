<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { currentLanguage } from '$lib/stores/current-language.store';
    import { supportedLanguages } from '$lib/utils/language-utils';

    const onLanguageSelected = async (event: Event) => {
        const target = event.target as HTMLSelectElement;
        $currentLanguage = target.value;
    };
</script>

<select class="select select-primary w-full max-w-xs" on:change={onLanguageSelected} bind:value={$currentLanguage}>
    <option value="" disabled selected>{$translate('page.fileManager.language.value')}</option>
    {#each supportedLanguages as { id, label }}
        <option value={id}>{label}</option>
    {/each}
</select>
