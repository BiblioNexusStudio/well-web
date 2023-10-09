<script lang="ts">
    import {
        biblesModuleBook,
        resourcesApiModule,
        resourcesMenu,
        selectedBookCode,
    } from '$lib/stores/file-manager.store';
    import { env } from '$env/dynamic/public';
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import pictureO from 'svelte-awesome/icons/pictureO';
    import arrowDown from 'svelte-awesome/icons/arrowDown';
    import { _ as translate } from 'svelte-i18n';
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import type { ResourcesApiModule } from '$lib/types/file-manager';
    import type { BasePassagesByBook } from '$lib/types/passage';
    import { buildRowData } from '$lib/utils/file-manager';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { currentLanguageInfo } from '$lib/stores/current-language.store';

    let allChaptersSelected = false;

    $: hasText = $biblesModuleBook.textSize > 0;
    $: addAdditaonalResourcesApiModule($resourcesApiModule);
    $: resetSelectAllChapters($selectedBookCode);

    async function addAdditaonalResourcesApiModule(resourcesApiModule: ResourcesApiModule) {
        let passageData: BasePassagesByBook[] = [];

        if ($resourcesMenu.some((resource) => resource.selected && resource.value === 'CBBTER')) {
            passageData = await fetchFromCacheOrApi(`passages/language/${$currentLanguageInfo?.id}/resource/CBBTER`);
        }

        resourcesApiModule.chapters.forEach(async (chapter) => {
            $biblesModuleBook.audioUrls.chapters[chapter.chapterNumber - 1].cbbterResourceUrls = [];
            if (chapter.contents.length > 0 && chapter.chapterNumber) {
                $biblesModuleBook.audioUrls.chapters[chapter.chapterNumber - 1].resourceMenuItems = chapter.contents;

                if (chapter.contents.some((content) => content.typeName === 'CBBTER') && passageData) {
                    let filteredPassages = passageData.find((data) => data.bookCode === $selectedBookCode);
                    chapter.contents.forEach((content) => {
                        if (content.typeName === 'CBBTER' && content.mediaTypeName === 'Audio') {
                            $biblesModuleBook.audioUrls.chapters[chapter.chapterNumber - 1].cbbterResourceUrls?.push({
                                url: `${env.PUBLIC_AQUIFER_API_URL}resources/${content.contentId}/metadata`,
                                mediaType: 'text',
                                size: 2048,
                            });
                        }
                    });

                    if (filteredPassages) {
                        filteredPassages.passages.forEach((passage) => {
                            if (
                                chapter.chapterNumber === passage.startChapter ||
                                chapter.chapterNumber === passage.endChapter
                            ) {
                                $biblesModuleBook.audioUrls.chapters[
                                    chapter.chapterNumber - 1
                                ].cbbterResourceUrls?.push({
                                    url: `${env.PUBLIC_AQUIFER_API_URL}passages/${passage.id}/language/${$currentLanguageInfo?.id}`,
                                    mediaType: 'text',
                                    size: 2048,
                                });
                            }
                        });
                    }
                }
            }
        });
    }

    function resetSelectAllChapters(selectedBookCode: string | null) {
        if (selectedBookCode) {
            allChaptersSelected = false;
        }
    }

    function selectAllChapters() {
        $biblesModuleBook.audioUrls.chapters = $biblesModuleBook.audioUrls.chapters.map((chapter) => {
            chapter.selected = !allChaptersSelected;
            return chapter;
        });
    }
</script>

<table class="w-full">
    <thead>
        <tr class="w-full h-16 border-y-2">
            <th>
                <input
                    type="checkbox"
                    class="checkbox checkbox-primary mx-2"
                    id="select-all-resources"
                    bind:checked={allChaptersSelected}
                    on:click={selectAllChapters}
                />
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
            {@const rowData = buildRowData(audioChapter, $resourcesMenu, hasText, $biblesModuleBook.textSize)}
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
                    {#if rowData.hasImages}
                        <Icon data={pictureO} />
                    {/if}
                </td>
            </tr>
        {/each}
    </tbody>
</table>
