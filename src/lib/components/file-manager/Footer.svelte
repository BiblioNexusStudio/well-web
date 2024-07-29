<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { downloadData, footerInputs, biblesModuleBook } from '$lib/stores/file-manager.store';
    import { isOnline } from '$lib/stores/is-online.store';
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import { Icon } from 'svelte-awesome';
    import download from 'svelte-awesome/icons/download';

    $: downloadingIsDisabled = $downloadData.nonMetadataSizeToDownload === 0 || !$isOnline;

    $: footerInputsDisabled = $biblesModuleBook.audioUrls?.chapters.every((chapter) => !chapter.selected);

    const updateFiles = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
        if (modal) {
            modal.showModal();
        }
    };
</script>

<footer class="footer footer-center fixed bottom-0 left-0 border-t-2 border-primary bg-base-100 p-4 text-base-content">
    <div class="container mx-auto flex flex-col">
        <div class="mb-2 flex w-full justify-between">
            <div class="flex items-center">
                <input
                    id="select-all"
                    type="checkbox"
                    class="checkbox-primary checkbox"
                    disabled={true}
                    bind:checked={$footerInputs.text}
                    data-app-insights-event-name="file-manager-footer-text-checkbox-toggled"
                />
                <label
                    for="select-all"
                    class="ms-2 cursor-pointer {downloadingIsDisabled ? 'text-gray-400' : 'text-primary'}"
                    >{$translate('page.fileManager.textType.value')}</label
                >
            </div>
            <div class="flex items-center">
                <input
                    id="select-all"
                    type="checkbox"
                    class="checkbox-primary checkbox"
                    disabled={footerInputsDisabled}
                    bind:checked={$footerInputs.audio}
                    data-app-insights-event-name="file-manager-footer-audio-checkbox-toggled"
                />
                <label
                    for="select-all"
                    class="ms-2 cursor-pointer {downloadingIsDisabled ? 'text-gray-400' : 'text-primary'}"
                    >{$translate('page.fileManager.audioType.value')}</label
                >
            </div>
            <div class="flex items-center">
                <input
                    id="select-all"
                    type="checkbox"
                    class="checkbox-primary checkbox"
                    disabled={footerInputsDisabled}
                    bind:checked={$footerInputs.media}
                    data-app-insights-event-name="file-manager-footer-media-checkbox-toggled"
                />
                <label
                    for="select-all"
                    class="ms-2 cursor-pointer {downloadingIsDisabled ? 'text-gray-400' : 'text-primary'}"
                    >{$translate('page.fileManager.mediaType.value')}</label
                >
            </div>
        </div>

        <div class="flex w-full justify-between">
            <div class="f-full flex items-center">
                <span class="text-l font-bold text-primary">
                    {convertToReadableSize($downloadData.totalSizeToDownload)}
                </span>
            </div>
            <button
                class="btn btn-primary ms-4"
                disabled={downloadingIsDisabled}
                on:click={updateFiles}
                data-app-insights-event-name="file-manager-footer-download-button-clicked"
            >
                {#if $isOnline}
                    <Icon data={download} /> {$translate('page.fileManager.download.value')}
                {:else}
                    {$translate('page.fileManager.noInternet.value')}
                {/if}
            </button>
        </div>
    </div>
</footer>
