<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import pictureO from 'svelte-awesome/icons/pictureO';
    import refresh from 'svelte-awesome/icons/refresh';
    import { biblesModuleBook } from '$lib/stores/file-manager.store';
    import { _ as translate } from 'svelte-i18n';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import type { ApiAudioChapter, BiblesModuleBook } from '$lib/types/file-manager';

    export let audioChapter: ApiAudioChapter;

    let hasMedia: boolean | null = null;
    const browserType = audioFileTypeForBrowser();

    $: displayName = $biblesModuleBook.displayName;
    $: hasText = $biblesModuleBook.textSize > 0 && $biblesModuleBook.textUrl.length > 0;
    $: hasAudio = audioChapter[browserType].size > 0;
    $: sizeAndResourceInformation = buildSizeAndResourceInformation($biblesModuleBook);

    function buildSizeAndResourceInformation(biblesModuleBook: BiblesModuleBook) {
        let size = 0;
        let numberOfResources = 0;

        if (biblesModuleBook.textSize > 0) {
            numberOfResources++;
            size += biblesModuleBook.textSize;
        }

        if (audioChapter[browserType].size > 0) {
            numberOfResources++;
            size += audioChapter[browserType].size;
        }

        return { size, numberOfResources };
    }
</script>

<tr class="w-full h-16 border-b-2 odd:bg-gray-100">
    <td class="text-center">
        <input type="checkbox" class="checkbox checkbox-primary mx-2" bind:checked={audioChapter.selected} />
    </td>

    <td>
        <div class="font-bold">{`${displayName} ${audioChapter.number}`}</div>
        <div>
            {sizeAndResourceInformation.numberOfResources}
            {$translate('page.fileManager.viewRow.resources.value')} | {convertToReadableSize(
                sizeAndResourceInformation.size
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
        {#if hasMedia === null}
            <Icon data={refresh} spin />
        {/if}
    </td>
</tr>
