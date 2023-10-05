<script lang="ts">
    import { biblesModuleBook, cbbterResources, resourcesMenu } from '$lib/stores/file-manager.store';
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import pictureO from 'svelte-awesome/icons/pictureO';
    import arrowDown from 'svelte-awesome/icons/arrowDown';
    import { _ as translate } from 'svelte-i18n';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import type { CbbterResource } from '$lib/types/file-manager';
    import { asyncForEach } from '$lib/utils/async-array';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { currentLanguageInfo } from '$lib/stores/current-language.store';
    import { buildRowData } from '$lib/utils/file-manager';

    $: hasText = $biblesModuleBook.textSize > 0;
    $: addAdditaonalCbbtErResources($cbbterResources);

    async function addAdditaonalCbbtErResources(cbbterResources: CbbterResource[]) {
        const cbbtErRourcesByCurrentBook = cbbterResources.find(
            (cbbterResource) => cbbterResource.bookCode === $biblesModuleBook.bookCode
        );

        if (cbbtErRourcesByCurrentBook) {
            await asyncForEach(cbbtErRourcesByCurrentBook.passages, async (passage) => {
                const cbbtErResourceWithContents = await fetchFromCacheOrApi(
                    `passages/${passage.id}/language/${$currentLanguageInfo?.id}`
                );

                if (cbbtErResourceWithContents.startChapter === cbbtErResourceWithContents.endChapter) {
                    $biblesModuleBook.audioUrls.chapters[
                        cbbtErResourceWithContents.startChapter - 1
                    ].cbbtErResourceWithContents = cbbtErResourceWithContents;
                }
            });
        }
    }
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
            {@const hasMedia = false}
            {@const rowData = buildRowData(
                audioChapter,
                $resourcesMenu,
                hasText,
                audioChapter[audioFileTypeForBrowser()].size
            )}
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
                        {rowData.resources}
                        {$translate('page.fileManager.viewRow.resources.value')} | {convertToReadableSize(rowData.size)}
                    </div>
                </td>
                <td class="text-center">
                    {#if rowData.hasText}
                        <Icon data={fileTextO} />
                    {/if}
                </td>
                <td class="text-center">
                    {#if rowData.hasAudio}
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
