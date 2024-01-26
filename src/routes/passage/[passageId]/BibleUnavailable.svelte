<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import { isOnline } from '$lib/stores/is-online.store';
    import type { FrontendBibleBook } from '$lib/types/bible-text-content';

    export let bibles: FrontendBibleBook[] | undefined;
    export let preferredBiblesModalOpen: boolean;
</script>

<div class="prose mx-auto flex h-full flex-col items-center py-4">
    <div class="flex-1" />
    <div class="flex flex-col items-center space-y-2">
        <div class="font-bold">{$translate('page.passage.noBibleContent.header.value')}</div>
        {#if bibles?.length}
            <div class="text-center">
                {@html $translate('page.passage.noBibleContent.description.value', {
                    values: { language: $currentLanguageInfo?.displayName },
                })}
            </div>
            <button class="btn btn-primary w-1/4" on:click|stopPropagation={() => (preferredBiblesModalOpen = true)}
                >{$translate('page.passage.noBibleContent.show.value')}</button
            >
        {:else}
            <div class="text-center">
                {@html $translate('page.passage.noBibleContent.noneAvailableDescription.value', {
                    values: { language: $currentLanguageInfo?.displayName },
                })}
            </div>
        {/if}
    </div>
    <div class="flex-1" />
    {#if $isOnline}
        <a class="semi-bold text-primary" href="/file-manager"
            >{$translate('page.passage.noBibleContent.checkForMoreResources.value')}</a
        >
    {/if}
</div>
