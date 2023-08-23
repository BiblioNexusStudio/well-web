<script lang="ts">
    import infoCircle from 'svelte-awesome/icons/infoCircle';
    import refresh from 'svelte-awesome/icons/refresh';
    import Icon from 'svelte-awesome';
    import { fileManagerLoading, bibleData, passageData } from '$lib/stores/file-manager.store';
    import { currentLanguage } from '$lib/stores/current-language.store';
    import { _ as translate } from 'svelte-i18n';
</script>

{#if $fileManagerLoading}
    <div class="alert alert-info flex mt-4 px-4">
        <div class="spin">
            <Icon data={refresh} />
        </div>
        <span>Loading...</span>
    </div>
{:else}
    <div class="alert alert-info flex mt-4 px-4">
        <Icon data={infoCircle} />
        {#if !$bibleData.length && !$passageData.length && $currentLanguage}
            <span>Sorry, we don't have data for this language.</span>
        {:else if !$currentLanguage.length}
            <span>{$translate('page.fileManager.selectLanguage.value')}</span>
        {/if}
    </div>
{/if}

<style>
    .spin {
        animation-name: ckw;
        animation-duration: 0.9s;
        animation-iteration-count: infinite;
        transform-origin: 50% 50%;
        display: inline-block;
    }
    @keyframes ckw {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
