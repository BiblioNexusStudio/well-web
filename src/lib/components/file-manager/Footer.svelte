<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { downloadData, footerInputs, biblesModuleBook } from '$lib/stores/file-manager.store';
    import { isOnline } from '$lib/stores/is-online.store';
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import { Icon } from 'svelte-awesome';
    import download from 'svelte-awesome/icons/download';

    $: downloadingIsDisabled =
        ($downloadData.totalSizeToDownload === 0 && $downloadData.totalSizeToDelete === 0) || !$isOnline;

    $: footerInputsDisabled = $biblesModuleBook.audioUrls.chapters.every((chapter) => !chapter.selected);

    const updateFiles = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
        if (modal) {
            modal.showModal();
        }
    };
</script>

<footer class="footer footer-center p-4 bg-base-100 border-t-2 border-primary text-base-content fixed bottom-0 left-0">
    <div class="container mx-auto flex flex-col">
        <div class="w-full mb-2 flex justify-between">
            <div class="flex items-center">
                <input
                    id="select-all"
                    type="checkbox"
                    class="checkbox checkbox-primary"
                    disabled={true}
                    bind:checked={$footerInputs.text}
                />
                <label
                    for="select-all"
                    class="cursor-pointer ml-2 {downloadingIsDisabled ? 'text-gray-400' : 'text-primary'}"
                    >{$translate('page.fileManager.textType.value')}</label
                >
            </div>
            <div class="flex items-center">
                <input
                    id="select-all"
                    type="checkbox"
                    class="checkbox checkbox-primary"
                    disabled={footerInputsDisabled}
                    bind:checked={$footerInputs.audio}
                />
                <label
                    for="select-all"
                    class="cursor-pointer ml-2 {downloadingIsDisabled ? 'text-gray-400' : 'text-primary'}"
                    >{$translate('page.fileManager.audioType.value')}</label
                >
            </div>
            <div class="flex items-center">
                <input
                    id="select-all"
                    type="checkbox"
                    class="checkbox checkbox-primary"
                    disabled={footerInputsDisabled}
                    bind:checked={$footerInputs.media}
                />
                <label
                    for="select-all"
                    class="cursor-pointer ml-2 {downloadingIsDisabled ? 'text-gray-400' : 'text-primary'}"
                    >{$translate('page.fileManager.mediaType.value')}</label
                >
            </div>
        </div>

        <div class="w-full flex justify-between">
            <div class="f-full flex items-center">
                <span class="text-primary text-l font-bold">
                    {$downloadData.urlsToDownload.filter(({ size }) => size !== 2048).length}
                    {$translate('page.fileManager.files.value')}; {convertToReadableSize(
                        $downloadData.totalSizeToDownload
                    )}
                </span>
            </div>
            <button class="btn btn-primary ml-4" disabled={downloadingIsDisabled} on:click={updateFiles}>
                {#if $isOnline}
                    <Icon data={download} /> {$translate('page.fileManager.download.value')}
                {:else}
                    {$translate('page.fileManager.noInternet.value')}
                {/if}
            </button>
        </div>
    </div>
</footer>
