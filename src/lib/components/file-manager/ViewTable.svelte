<script lang="ts">
    import {
        biblesModuleBook,
        resourcesApiModule,
        resourcesMenu,
        selectedBookCode,
    } from '$lib/stores/file-manager.store';
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import arrowDown from 'svelte-awesome/icons/arrowDown';
    import ellipsisV from 'svelte-awesome/icons/ellipsisV';
    import trash from 'svelte-awesome/icons/trash';
    import { _ as translate } from 'svelte-i18n';
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import type { ResourcesApiModule, BiblesModuleBook } from '$lib/types/file-manager';
    import type { BasePassagesByBook } from '$lib/types/passage';
    import { buildRowData } from '$lib/utils/file-manager';
    import { METADATA_ONLY_FAKE_FILE_SIZE, fetchFromCacheOrApi } from '$lib/data-cache';
    import { currentLanguageInfo } from '$lib/stores/current-language.store';
    import { passageContentApiFullPath } from '$lib/utils/data-handlers/resources/passages';
    import { MediaType } from '$lib/types/resource';
    import Image from '$lib/icons/Image.svelte';
    import ImageAndVideo from '$lib/icons/ImageAndVideo.svelte';
    import Video from '$lib/icons/Video.svelte';

    let allChaptersSelected = false;
    let allChaptersCached = false;

    $: hasText = $biblesModuleBook.textSize > 0;
    $: addAdditaonalResourcesApiModule($resourcesApiModule);
    $: resetSelectAllChapters($selectedBookCode);
    $: addAllUrlsCachedProperty($biblesModuleBook);
    $: textUrlIsCached = $biblesModuleBook.isTextUrlCached;

    async function addAdditaonalResourcesApiModule(resourcesApiModule: ResourcesApiModule) {
        let passageData: BasePassagesByBook[] = [];

        if ($resourcesMenu.some((resource) => resource.selected && resource.value === 'CBBTER')) {
            passageData = await fetchFromCacheOrApi(`passages/language/${$currentLanguageInfo?.id}/resource/CBBTER`);
        }

        resourcesApiModule.chapters.forEach(async (chapter) => {
            if (chapter.contents.length > 0 && chapter.chapterNumber) {
                const chapterInfoExists = !!$biblesModuleBook.audioUrls.chapters[chapter.chapterNumber - 1];
                if (chapterInfoExists) {
                    $biblesModuleBook.audioUrls.chapters[chapter.chapterNumber - 1].resourceMenuItems =
                        chapter.contents;
                }

                if (chapter.contents.some((content) => content.typeName === 'CBBTER') && passageData) {
                    let filteredPassages = passageData.find((data) => data.bookCode === $selectedBookCode);

                    if (filteredPassages) {
                        filteredPassages.passages.forEach((passage) => {
                            if (
                                chapterInfoExists &&
                                (chapter.chapterNumber === passage.startChapter ||
                                    chapter.chapterNumber === passage.endChapter)
                            ) {
                                $biblesModuleBook.audioUrls.chapters[
                                    chapter.chapterNumber - 1
                                ].cbbterResourceUrls?.push({
                                    url: passageContentApiFullPath(passage),
                                    mediaType: MediaType.Text,
                                    metadataOnly: true,
                                    size: METADATA_ONLY_FAKE_FILE_SIZE,
                                });
                            }
                        });
                    }
                }
            }
        });
    }

    function addAllUrlsCachedProperty(biblesModuleBook: BiblesModuleBook) {
        biblesModuleBook.audioUrls.chapters.forEach((audioChapter) => {
            const allUrlsCached =
                biblesModuleBook.isTextUrlCached &&
                audioChapter.isAudioUrlCached &&
                audioChapter.resourceMenuItems?.every((resourceMenuItem) => resourceMenuItem?.isResourceUrlCached);
            if (allUrlsCached) {
                audioChapter.allUrlsCached = true;
                audioChapter.selected = true;
            }
        });

        const everyChaptersCached = biblesModuleBook.audioUrls.chapters.every((chapter) => chapter.allUrlsCached);
        if (everyChaptersCached) {
            allChaptersSelected = true;
            allChaptersCached = true;
        }
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

    function openDeleteModal() {
        const modal = document.getElementById('file-manager-delete-modal') as HTMLDialogElement;
        if (modal) {
            modal.showModal();
        }
    }
</script>

<table class="w-full">
    <thead>
        <tr class="h-16 w-full border-y-2">
            <th>
                <input
                    type="checkbox"
                    class="checkbox-primary checkbox mx-2"
                    id="select-all-resources"
                    bind:checked={allChaptersSelected}
                    on:click={selectAllChapters}
                    disabled={allChaptersCached}
                />
            </th>
            <th class="text-start text-xs">
                {$translate('page.fileManager.viewHeader.name.value')}
                <Icon data={arrowDown} />
            </th>
            <th class="text-xs"> {$translate('page.fileManager.viewHeader.text.value')} </th>
            <th class="text-xs"> {$translate('page.fileManager.viewHeader.audio.value')} </th>
            <th class="text-xs"> {$translate('page.fileManager.viewHeader.media.value')} </th>
            <th />
        </tr>
    </thead>
    <tbody>
        {#each $biblesModuleBook.audioUrls.chapters as audioChapter, index (index)}
            {@const rowData = buildRowData(audioChapter, $resourcesMenu, hasText, $biblesModuleBook.textSize)}
            <tr class="relative h-16 w-full border-b-2 odd:bg-gray-100">
                <td class="text-center">
                    <input
                        type="checkbox"
                        class="checkbox-primary checkbox mx-2"
                        bind:checked={audioChapter.selected}
                        disabled={audioChapter.allUrlsCached}
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
                    <div class="inline-block">
                        {#if rowData.hasImages && rowData.hasVideos}
                            <ImageAndVideo />
                        {:else if rowData.hasImages}
                            <Image />
                        {:else if rowData.hasVideos}
                            <Video />
                        {/if}
                    </div>
                </td>
                <td class="h-full text-center">
                    {#if audioChapter.allUrlsCached || (index === 0 && textUrlIsCached)}
                        <button
                            on:click={() => (audioChapter.deleteMenuOpen = !audioChapter.deleteMenuOpen)}
                            class={audioChapter.deleteMenuOpen ? 'h-10 rounded-full bg-primary py-2' : 'h-8'}
                        >
                            <Icon data={ellipsisV} class="h-full w-6" />
                        </button>
                        {#if audioChapter.deleteMenuOpen}
                            <button
                                on:click={() => {
                                    audioChapter.deleteMenuOpen = false;
                                    audioChapter.deleteResources = true;
                                    openDeleteModal();
                                }}
                                class="absolute left-0 z-30 mx-2 flex w-[96vw] items-center justify-start rounded-md border-2 border-solid border-primary bg-white px-4 py-2"
                            >
                                <Icon data={trash} class="me-2" />
                                {$translate('page.fileManager.delete.value')}
                            </button>
                        {/if}
                    {/if}
                </td>
            </tr>
        {/each}
    </tbody>
</table>
