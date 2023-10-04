<script lang="ts">
    import { biblesModuleBook } from '$lib/stores/file-manager.store';
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import pictureO from 'svelte-awesome/icons/pictureO';
    import arrowDown from 'svelte-awesome/icons/arrowDown';
    import { _ as translate } from 'svelte-i18n';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import { convertToReadableSize } from '$lib/utils/file-manager';

    let hasMedia = false;
    $: hasText = $biblesModuleBook.textSize > 0;
</script>

<table class="w-full">
    <thead>
        <tr class="w-full h-16 border-y-2">
            <th>
                <input type="checkbox" class="checkbox checkbox-primary mx-2" id="select-all-resources" />
            </th>
            <th class="text-start text-xs">
                {$translate('page.fileManager.viewHeader.name.value')}
                <Icon data={arrowDown} />
            </th>
            <th class="text-xs"> {$translate('page.fileManager.viewHeader.text.value')} </th>
            <th class="text-xs"> {$translate('page.fileManager.viewHeader.audio.value')} </th>
            <th class="text-xs"> {$translate('page.fileManager.viewHeader.media.value')} </th>
        </tr>
    </thead>
    <tbody>
        {#each $biblesModuleBook.audioUrls.chapters as audioChapter}
            {@const hasAudio = audioChapter[audioFileTypeForBrowser()].size > 0}
            {@const numberOfresources = (() => {
                let resources = 0;
                if (hasText) {
                    resources += 1;
                }

                if (hasAudio) {
                    resources += 1;
                }
                return resources;
            })()}
            {@const resourcesSize = (() => {
                let size = 0;
                if (hasText) {
                    size += audioChapter[audioFileTypeForBrowser()].size;
                }

                if (hasAudio) {
                    size += audioChapter[audioFileTypeForBrowser()].size;
                }
                return size;
            })()}
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
                        {numberOfresources}
                        {$translate('page.fileManager.viewRow.resources.value')} | {convertToReadableSize(
                            resourcesSize
                        )}
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
                    {#if hasMedia}
                        <Icon data={pictureO} />
                    {/if}
                </td>
            </tr>
        {/each}
    </tbody>
</table>
