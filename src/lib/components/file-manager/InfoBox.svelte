<script lang="ts">
    import infoCircle from 'svelte-awesome/icons/infoCircle';
    import refresh from 'svelte-awesome/icons/refresh';
    import Icon from 'svelte-awesome';
    import { fileManagerLoading, bibleData } from '$lib/stores/file-manager.store';
    import { language } from '$lib/stores/language.store';
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
        {#if $bibleData.length === 0 && $language.length > 0 && !$fileManagerLoading}
            <span>Sorry, we don't have data for this language.</span>
        {:else if $bibleData.length === 0 && $language.length === 0 && !$fileManagerLoading}
            <span>Please select a language.</span>
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
