<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { currentLanguageCode } from '$lib/stores/current-language.store';
    import { supportedLanguages } from '$lib/utils/language-utils';

    const onLanguageSelected = async (event: Event) => {
        const target = event.target as HTMLSelectElement;
        $currentLanguageCode = target.value;
    };
</script>

<select class="select select-primary w-full max-w-xs" on:change={onLanguageSelected} bind:value={$currentLanguageCode}>
    <option value="" disabled selected>{$translate('page.fileManager.language.value')}</option>
    {#each supportedLanguages as { code, label }}
        <option value={code}>{label}</option>
    {/each}
</select>
