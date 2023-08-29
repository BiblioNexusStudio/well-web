<script lang="ts">
    import { passageData } from '$lib/stores/file-manager.store';
    import { MediaType, type FrontendPassage, type MediaTypeEnum } from '$lib/types/file-manager';
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import Icon from 'svelte-awesome';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import chevronDown from 'svelte-awesome/icons/chevronDown';
    import { _ as translate } from 'svelte-i18n';
    import { objectEntries, objectValues } from '$lib/utils/typesafe-standard-lib';

    const mediaTypeSwitch = (mediaType: MediaTypeEnum) => {
        switch (mediaType) {
            case MediaType.text:
                return $translate('page.fileManager.textType.value');
            case MediaType.audio:
                return $translate('page.fileManager.audioType.value');
            case MediaType.images:
                return $translate('page.fileManager.imagesType.value');
        }
    };

    const totalSize = (passage: FrontendPassage) => {
        let total = 0;
        objectValues(passage.resources).forEach(({ urlsAndSizes }) => {
            total += urlsAndSizes.reduce((acc, { size }) => acc + size, 0);
        });
        return convertToReadableSize(total);
    };

    const addPassageResourceToDelete = (passage: FrontendPassage, mediaType: MediaTypeEnum) => {
        passage.resources[mediaType].selected = false;
        $passageData = $passageData;
    };

    const addPassageResourceToDownloads = (passage: FrontendPassage, mediaType: MediaTypeEnum) => {
        passage.resources[mediaType].selected = true;
        $passageData = $passageData;
    };

    const addAllPassageResources = (passage: FrontendPassage) => {
        if (passage.selected) {
            passage.selected = false;
            objectValues(passage.resources).forEach((resourceInfo) => {
                resourceInfo.selected = false;
            });
            return;
        } else {
            passage.selected = true;
            objectValues(passage.resources).forEach((resourceInfo) => {
                resourceInfo.selected = true;
            });
        }
        $passageData = $passageData;
    };
</script>

<table class="table">
    <thead>
        <tr>
            <th id="select-all-book-contents">{$translate('page.fileManager.download.value')}</th>
            <th>{$translate('page.fileManager.passage.value')}</th>
            <th>{$translate('page.fileManager.size.value')}</th>
            <th>{$translate('page.fileManager.expand.value')}</th>
        </tr>
    </thead>
    <tbody>
        {#each $passageData as passage}
            <tr>
                <td>
                    <label>
                        <input
                            type="checkbox"
                            aria-labelledby="select-all-book-contents"
                            class="checkbox checkbox-primary"
                            bind:checked={passage.selected}
                            on:click={() => addAllPassageResources(passage)}
                        />
                    </label>
                </td>

                <td>
                    <div class="flex items-center space-x-3">
                        <div>
                            <div class="font-bold">{passage.primaryResourceName}</div>
                        </div>
                    </div>
                </td>
                <td>{totalSize(passage)}</td>
                <td>
                    <button
                        class="btn btn-primary btn-sm"
                        aria-label={passage.expanded
                            ? $translate('page.fileManager.a11y.collapseResources.value', {
                                  values: {
                                      bookName: passage.primaryResourceName,
                                  },
                              })
                            : $translate('page.fileManager.a11y.expandResources.value', {
                                  values: {
                                      bookName: passage.primaryResourceName,
                                  },
                              })}
                        on:click={() => (passage.expanded = !passage.expanded)}
                    >
                        <Icon class="cursor-pointer text-white" data={passage.expanded ? chevronUp : chevronDown} />
                    </button>
                </td>
            </tr>
            {#if passage.expanded && objectEntries(passage.resources).length > 0}
                <tr class="bg-secondary text-neutral">
                    <td id="select-one-resource-to-download" class="font-bold"
                        >{$translate('page.fileManager.download.value')}</td
                    >
                    <td class="font-bold">{$translate('page.fileManager.passage.value')}</td>
                    <td class="font-bold">{$translate('page.fileManager.type.value')}</td>
                    <td class="font-bold">{$translate('page.fileManager.size.value')}</td>
                </tr>
                {#each objectEntries(passage.resources) as [mediaType, resourceInfo]}
                    {#if resourceInfo.urlsAndSizes.length}
                        <tr class="bg-primary">
                            <td>
                                <label>
                                    <input
                                        type="checkbox"
                                        aria-labelledby="select-one-resource-to-download"
                                        bind:checked={resourceInfo.selected}
                                        on:click={() =>
                                            resourceInfo.selected
                                                ? addPassageResourceToDelete(passage, mediaType)
                                                : addPassageResourceToDownloads(passage, mediaType)}
                                        class="checkbox checkbox-secondary"
                                    />
                                </label>
                            </td>
                            <td>{passage.primaryResourceName}</td>
                            <td>{mediaTypeSwitch(mediaType)}</td>
                            <td
                                >{convertToReadableSize(
                                    resourceInfo.urlsAndSizes.reduce((acc, { size }) => acc + size, 0)
                                )}</td
                            >
                        </tr>
                    {/if}
                {/each}
            {/if}
        {/each}
    </tbody>
</table>
