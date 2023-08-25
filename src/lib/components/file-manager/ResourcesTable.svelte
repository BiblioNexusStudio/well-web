<script lang="ts">
    import { passageData } from '$lib/stores/file-manager.store';
    import type { Passages } from '$lib/types/fileManager';
    import { convertToReadableSize, addUrlToDownloads, addUrlToDelete } from '$lib/utils/file-manager';
    import Icon from 'svelte-awesome';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import chevronDown from 'svelte-awesome/icons/chevronDown';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import { _ as translate } from 'svelte-i18n';

    const mediaTypeSwitch = (type: number) => {
        switch (type) {
            case 1:
                return 'Text';
            case 2:
                return 'Audio';
            default:
                return 'Unknown';
        }
    };

    const totalSize = (passage: Passages) => {
        let total = 0;
        passage.resources.forEach((resource) => {
            total += resource?.content?.contentSize || 0;
        });
        return convertToReadableSize(total);
    };

    const firstDisplayName = (passage: Passages) => {
        return passage.resources.find((p) => p.englishLabel)?.englishLabel;
    };

    const addPassageResourceToDelete = (passageResource: any) => {
        if (passageResource.mediaType === 1) {
            addUrlToDelete(passageResource.content?.content?.url || '', passageResource?.content?.contentSize);
        }
        if (passageResource.mediaType === 2) {
            passageResource.content?.content?.steps.forEach((step: any) => {
                addUrlToDelete(step[audioFileTypeForBrowser()].url, step[audioFileTypeForBrowser()].size);
            });
        }
    };

    const addPassageResourceToDownloads = (passageResource: any) => {
        if (passageResource.mediaType === 1) {
            addUrlToDownloads(passageResource.content?.content?.url || '', passageResource?.content?.contentSize);
        }
        if (passageResource.mediaType === 2) {
            passageResource.content?.content?.steps.forEach((step: any) => {
                addUrlToDownloads(step[audioFileTypeForBrowser()].url, step[audioFileTypeForBrowser()].size);
            });
        }
    };

    const addAllPassageResources = (passage: Passages) => {
        if (passage.selected) {
            passage.selected = false;
            passage.resources.forEach((resource) => {
                resource.selected = false;
                addPassageResourceToDelete(resource);
            });
            return;
        } else {
            passage.selected = true;
            passage.resources.forEach((resource) => {
                resource.selected = true;
                addPassageResourceToDownloads(resource);
            });
        }
    };
</script>

<table class="table">
    <thead>
        <tr>
            <th>{$translate('page.fileManager.download.value')}</th>
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
                            : $translate('page.fileManager.a11y.expandedResources.value', {
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
            {#if passage.expanded && passage.resources.length > 0}
                <tr class="bg-secondary text-neutral">
                    <td class="font-bold">{$translate('page.fileManager.download.value')}</td>
                    <td class="font-bold">{$translate('page.fileManager.passage.value')}</td>
                    <td class="font-bold">{$translate('page.fileManager.type.value')}</td>
                    <td class="font-bold">{$translate('page.fileManager.size.value')}</td>
                </tr>
                {#each passage.resources as passageResource}
                    <tr class="bg-primary">
                        <td>
                            <label>
                                <input
                                    type="checkbox"
                                    bind:checked={passageResource.selected}
                                    on:click={() =>
                                        passageResource.selected
                                            ? addPassageResourceToDelete(passageResource)
                                            : addPassageResourceToDownloads(passageResource)}
                                    class="checkbox checkbox-secondary"
                                />
                            </label>
                        </td>
                        <td>{passageResource.englishLabel}</td>
                        <td>{mediaTypeSwitch(passageResource.mediaType)}</td>
                        <td>{convertToReadableSize(passageResource.content?.contentSize || 0)}</td>
                    </tr>
                {/each}
            {/if}
        {/each}
    </tbody>
</table>
