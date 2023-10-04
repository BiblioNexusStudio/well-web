<script lang="ts">
    import ViewHeader from './ViewHeader.svelte';
    import { biblesModuleBook } from '$lib/stores/file-manager.store';
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import pictureO from 'svelte-awesome/icons/pictureO';
    import { _ as translate } from 'svelte-i18n';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';

    $: hasText = $biblesModuleBook.textSize > 0;
</script>

<table class="w-full">
    <ViewHeader />
    <tbody>
        {#each $biblesModuleBook.audioUrls.chapters as audioChapter}
            {@const hasAudio = audioChapter[audioFileTypeForBrowser()].size > 0}
            <tr class="w-full h-16 border-b-2 odd:bg-gray-100">
                <td class="text-center">
                    <input
                        type="checkbox"
                        class="checkbox checkbox-primary mx-2"
                        bind:checked={audioChapter.selected}
                    />
                </td>

                <td>
                    <div class="font-bold">{`${$biblesModuleBook.displayName} ${audioChapter.number}`}</div>
                    <div>
                        2
                        {$translate('page.fileManager.viewRow.resources.value')} | 2 MB
                    </div>
                </td>
                <td class="text-center">
                    {#if hasText}
                        <Icon data={fileTextO} />
                    {/if}
                </td>
                <td class="text-center">
                    {#if hasAudio}
                        <Icon data={volumeUp} />
                    {/if}
                </td>
                <td class="text-center">
                    {#if false}
                        <Icon data={pictureO} />
                    {/if}
                </td>
            </tr>
        {/each}
    </tbody>
</table>
