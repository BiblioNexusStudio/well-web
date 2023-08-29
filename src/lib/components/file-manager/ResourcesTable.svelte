<script lang="ts">
    import { passageData } from '$lib/stores/file-manager.store';
    import type { Passages } from '$lib/types/file-manager';
    import { convertToReadableSize, addUrlToDownloads, addUrlToDelete } from '$lib/utils/file-manager';
    import Icon from 'svelte-awesome';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import chevronDown from 'svelte-awesome/icons/chevronDown';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import { _ as translate } from 'svelte-i18n';

    const mediaTypeSwitch = (mediaType: string) => {
        switch (mediaType) {
            case 'text':
                return $translate('page.fileManager.textType');
            case 'audio':
                return $translate('page.fileManager.audioType');
            case 'images':
                return $translate('page.fileManager.imagesType');
            default:
                return 'Unknown';
        }
    };

    const totalSize = (passage: Passages) => {
        let total = 0;
        Object.values(passage.resources).forEach(({ urlsAndSizes }) => {
            total += urlsAndSizes.reduce((acc, { size }) => acc + size, 0);
        });
        return convertToReadableSize(total);
    };

    const firstDisplayName = (passage: Passages) => {
        return passage.resources.find((p) => p.englishLabel)?.englishLabel;
    };

    const addPassageResourceToDelete = (passage, mediaType) => {
        passage[mediaType].urlsAndSizes.forEach(({ url, size }) => addUrlToDelete(url, size));
    };

    const addPassageResourceToDownloads = (passage, mediaType) => {
        passage[mediaType].urlsAndSizes.forEach(({ url, size }) => addUrlToDownloads(url, size));
    };

    const addAllPassageResources = (passage: Passages) => {
        if (passage.selected) {
            passage.selected = false;
            Object.entries(passage.resources).forEach(([mediaType, resourceInfo]) => {
                resourceInfo.selected = false;
                addPassageResourceToDelete(passage, mediaType);
            });
            return;
        } else {
            passage.selected = true;
            Object.entries(passage.resources).forEach(([mediaType, resourceInfo]) => {
                resourceInfo.selected = true;
                addPassageResourceToDownloads(passage, mediaType);
            });
        }
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
                            <div class="font-bold">{firstDisplayName(passage)}</div>
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
                                      bookName: firstDisplayName(passage),
                                  },
                              })
                            : $translate('page.fileManager.a11y.expandResources.value', {
                                  values: {
                                      bookName: firstDisplayName(passage),
                                  },
                              })}
                        on:click={() => (passage.expanded = !passage.expanded)}
                    >
                        <Icon class="cursor-pointer text-white" data={passage.expanded ? chevronUp : chevronDown} />
                    </button>
                </td>
            </tr>
            {#if passage.expanded && Object.entries(passage.resources).length > 0}
                <tr class="bg-secondary text-neutral">
                    <td id="select-one-resource-to-download" class="font-bold"
                        >{$translate('page.fileManager.download.value')}</td
                    >
                    <td class="font-bold">{$translate('page.fileManager.passage.value')}</td>
                    <td class="font-bold">{$translate('page.fileManager.type.value')}</td>
                    <td class="font-bold">{$translate('page.fileManager.size.value')}</td>
                </tr>
                {#each Object.entries(passage.resources) as [mediaType, resourceInfo]}
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
                        <td>{firstDisplayName(passage)}</td>
                        <td>{mediaTypeSwitch(mediaType)}</td>
                        <td
                            >{convertToReadableSize(
                                resourceInfo.urlsAndSizes.reduce((acc, { size }) => acc + size, 0)
                            )}</td
                        >
                    </tr>
                {/each}
            {/if}
        {/each}
    </tbody>
</table>
