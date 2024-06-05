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
    import { buildRowData } from '$lib/utils/file-manager';
    import { METADATA_ONLY_FAKE_FILE_SIZE, apiUrl, cacheManyContentUrlsWithProgress } from '$lib/data-cache';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import { MediaType, ParentResourceType, PredeterminedPassageGuides } from '$lib/types/resource';
    import Image from '$lib/icons/Image.svelte';
    import ImageAndVideo from '$lib/icons/ImageAndVideo.svelte';
    import Video from '$lib/icons/Video.svelte';
    import {
        booksAndChaptersByLanguageAndParentResourceEndpoint,
        passagesByLanguageAndParentResourceEndpoint,
    } from '$lib/api-endpoints';

    let allChaptersSelected = false;
    let allChaptersCached = false;

    $: hasText = $biblesModuleBook.textSize > 0;
    $: addAdditionalResourcesApiModule($resourcesApiModule);
    $: resetSelectAllChapters($selectedBookCode);
    $: addAllUrlsCachedProperty($biblesModuleBook);
    $: textUrlIsCached = $biblesModuleBook.isTextUrlCached;

    async function addAdditionalResourcesApiModule(resourcesApiModule: ResourcesApiModule) {
        resourcesApiModule.chapters.forEach((chapter) => {
            if (chapter.contents.length > 0 && chapter.chapterNumber) {
                const chapterInfoExists = !!$biblesModuleBook.audioUrls?.chapters[chapter.chapterNumber - 1];
                if (chapterInfoExists) {
                    if ($biblesModuleBook.audioUrls?.chapters[chapter.chapterNumber - 1]) {
                        $biblesModuleBook.audioUrls.chapters[chapter.chapterNumber - 1]!.resourceMenuItems =
                            chapter.contents;
                    }
                }
            }
        });

        await cacheGuidePassagesOrChapters();
    }

    // When the user selects a guide in the resource menu we want to cache the appropriate data.
    // We'll use the list of passages or the list of chapters as a starting point for determining
    // what can be shown when the guide is selected.
    async function cacheGuidePassagesOrChapters() {
        const urlsToCache = $resourcesMenu
            .filter(
                (resource) => resource.selected && resource.parentResource?.resourceType === ParentResourceType.Guide
            )
            .map((resource) => {
                if (resource.parentResource?.id && PredeterminedPassageGuides.includes(resource.parentResource.id)) {
                    return {
                        url: apiUrl(
                            passagesByLanguageAndParentResourceEndpoint(
                                $currentLanguageInfo?.id,
                                resource.parentResource?.id
                            )[0]
                        ),
                        size: METADATA_ONLY_FAKE_FILE_SIZE,
                        mediaType: MediaType.Text,
                    };
                } else {
                    return {
                        url: apiUrl(
                            booksAndChaptersByLanguageAndParentResourceEndpoint(
                                $currentLanguageInfo?.id,
                                resource.parentResource?.id
                            )[0]
                        ),
                        size: METADATA_ONLY_FAKE_FILE_SIZE,
                        mediaType: MediaType.Text,
                    };
                }
            });
        await cacheManyContentUrlsWithProgress(urlsToCache);
    }

    function addAllUrlsCachedProperty(biblesModuleBook: BiblesModuleBook) {
        biblesModuleBook.audioUrls?.chapters.forEach((audioChapter) => {
            const allUrlsCached =
                biblesModuleBook.isTextUrlCached &&
                audioChapter.isAudioUrlCached &&
                audioChapter.resourceMenuItems?.every((resourceMenuItem) => resourceMenuItem?.isResourceUrlCached);
            if (allUrlsCached) {
                audioChapter.allUrlsCached = true;
                audioChapter.selected = true;
            }
        });

        const everyChaptersCached = biblesModuleBook.audioUrls?.chapters.every((chapter) => chapter.allUrlsCached);
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
        if ($biblesModuleBook.audioUrls) {
            $biblesModuleBook.audioUrls.chapters = $biblesModuleBook.audioUrls.chapters.map((chapter) => {
                chapter.selected = !allChaptersSelected;
                return chapter;
            });
        }
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
                    data-app-insights-event-name="file-manager-select-all-resources-checkbox"
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
        {#if $biblesModuleBook.audioUrls}
            {#each $biblesModuleBook.audioUrls.chapters as audioChapter, index (index)}
                {@const rowData = buildRowData(audioChapter, $resourcesMenu, hasText, $biblesModuleBook.textSize)}
                <tr class="relative h-16 w-full border-b-2 odd:bg-gray-100">
                    <td class="text-center">
                        <input
                            type="checkbox"
                            class="checkbox-primary checkbox mx-2"
                            bind:checked={audioChapter.selected}
                            disabled={audioChapter.allUrlsCached}
                            data-app-insights-event-name={`file-manager-${$biblesModuleBook.displayName}-${audioChapter.number}-checkbox-selected`}
                        />
                    </td>

                    <td>
                        <div class="font-bold">{`${$biblesModuleBook.displayName} ${audioChapter.number}`}</div>
                        <div>
                            {rowData.resources}
                            {$translate('page.fileManager.viewRow.resources.value')} | {convertToReadableSize(
                                rowData.size
                            )}
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
                                data-app-insights-event-name="file-manager-view-row-delete-button-clicked"
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
                                    data-app-insights-event-name="file-manager-delete-button-clicked"
                                >
                                    <Icon data={trash} class="me-2" />
                                    {$translate('page.fileManager.delete.value')}
                                </button>
                            {/if}
                        {/if}
                    </td>
                </tr>
            {/each}
        {/if}
    </tbody>
</table>
