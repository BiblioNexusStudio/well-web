<script lang="ts">
    import infoCircle from 'svelte-awesome/icons/infoCircle';
    import refresh from 'svelte-awesome/icons/refresh';
    import Icon from 'svelte-awesome';
    import { fileManagerLoading, bibleData, passageData } from '$lib/stores/file-manager.store';
    import { currentLanguageCode } from '$lib/stores/current-language.store';
    import { _ as translate } from 'svelte-i18n';
</script>

{#if $fileManagerLoading}
    <div class="alert alert-info flex mt-4 w-10/12 mx-auto">
        <Icon data={refresh} spin />
        <span>Loading...</span>
    </div>
{:else}
    <div class="alert alert-info flex mt-4 w-10/12 mx-auto">
        <Icon data={infoCircle} />
        {#if !$bibleData.length && !$passageData.length && $currentLanguageCode}
            <span>Sorry, we don't have data for this language.</span>
        {:else if !$currentLanguageCode.length}
            <span>{$translate('page.fileManager.selectLanguage.value')}</span>
        {/if}
    </div>
{/if}
