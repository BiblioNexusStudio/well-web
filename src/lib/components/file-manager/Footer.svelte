<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { downloadData, footerInputs } from '$lib/stores/file-manager.store';
    import { isOnline } from '$lib/stores/is-online.store';
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import { Icon } from 'svelte-awesome';
    import download from 'svelte-awesome/icons/download';
    import { featureFlags } from '$lib/stores/feature-flags.store';

    $: downloadingIsDisabled =
        ($downloadData.totalSizeToDownload === 0 && $downloadData.totalSizeToDelete === 0) || !isOnline;

    const updateFiles = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
        if (modal) {
            modal.showModal();
        }
    };
</script>

<footer class="footer footer-center p-4 bg-base-100 border-t-2 border-primary text-base-content fixed bottom-0 left-0">
    <div class="container mx-auto flex flex-col">
        {#if $featureFlags.newFileManager}
            <div class="w-full mb-2 flex justify-between">
                <div class="flex items-center">
                    <input
                        id="select-all"
                        type="checkbox"
                        class="checkbox checkbox-primary"
                        disabled={downloadingIsDisabled}
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
                        disabled={downloadingIsDisabled}
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
                        disabled={downloadingIsDisabled}
                        bind:checked={$footerInputs.media}
                    />
                    <label
                        for="select-all"
                        class="cursor-pointer ml-2 {downloadingIsDisabled ? 'text-gray-400' : 'text-primary'}"
                        >{$translate('page.fileManager.mediaType.value')}</label
                    >
                </div>
            </div>
        {/if}
        <div class="w-full flex justify-between">
            <div class="f-full flex items-center">
                <span class="text-primary text-l font-bold">
                    {$downloadData.urlsToDownload.length}
                    {$translate('page.fileManager.files.value')}; {convertToReadableSize(
                        $downloadData.totalSizeToDownload
                    )}
                </span>
            </div>
            <button class="btn btn-primary ml-4" disabled={downloadingIsDisabled} on:click={updateFiles}
                ><Icon data={download} /> {$translate('page.fileManager.download.value')}</button
            >
        </div>
    </div>
</footer>
