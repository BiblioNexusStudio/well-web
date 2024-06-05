<script lang="ts">
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import { removeFromContentCache, cacheManyContentUrlsWithProgress, type AllItemsProgress } from '$lib/data-cache';
    import { _ as translate } from 'svelte-i18n';
    import { objectKeys, objectValues } from '$lib/utils/typesafe-standard-lib';
    import { downloadData } from '$lib/stores/file-manager.store';

    let downloadInProgress = false;
    let downloadedSuccessfully = false;
    let totalSizeToDownload = 1;
    let totalSizeDownloaded = 0;

    const continueUpdateFiles = () => {
        $downloadData.urlsToDelete.forEach(removeFromContentCache);

        if ($downloadData.urlsToDownload.length > 0) {
            cacheManyContentUrlsWithProgress($downloadData.urlsToDownload, progressCallback);
            downloadInProgress = true;
        } else {
            const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
            if (modal) {
                modal.close();
            }
        }
    };

    const progressCallback = (progress: AllItemsProgress) => {
        [totalSizeToDownload, totalSizeDownloaded] = objectValues(progress).reduce(
            ([runningTotal, runningDownloaded], { downloadedSize, totalSize }) => [
                runningTotal + totalSize,
                runningDownloaded + downloadedSize,
            ],
            [0, 0]
        );
        const downloadFinished = objectKeys(progress).every((key: string) => progress[key]!.done);

        if (downloadFinished) {
            downloadInProgress = false;
            downloadedSuccessfully = true;
        }
    };

    const cancelUpdateFiles = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
        if (modal) {
            modal.close();
        }
    };

    const closeModal = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
        if (modal) {
            modal.close();
        }
        downloadedSuccessfully = false;
    };

    const cancelCurrentDownload = () => {
        window.location.reload();
    };
</script>

<dialog id="file-manager-modal" class="modal">
    {#if downloadInProgress}
        <form class="modal-box">
            <h3 class="text-lg font-bold">{$translate('page.fileManager.modal.downloadProgress.value')}</h3>
            <div class="divider" />
            <p class="mb-2">
                {$translate('page.fileManager.modal.downloadingDescription.value', {
                    values: {
                        totalSizeDownloaded: convertToReadableSize(totalSizeDownloaded),
                        totalSizeToDownload: convertToReadableSize(totalSizeToDownload),
                    },
                })}
            </p>
            <progress
                class="w-100 progress progress-primary mb-4"
                value={totalSizeDownloaded}
                max={totalSizeToDownload}
            />
            <div class="flex justify-end">
                <button
                    class="btn btn-primary"
                    on:click={cancelCurrentDownload}
                    data-app-insights-event-name="file-manager-cancel-download-button-clicked"
                    >{$translate('page.fileManager.cancel.value')}</button
                >
            </div>
        </form>
    {:else if downloadedSuccessfully && !downloadInProgress}
        <form class="modal-box">
            <h3 class="text-lg font-bold">{$translate('page.fileManager.modal.success.value')}</h3>
            <div class="divider" />
            <div class="flex justify-end">
                <button
                    class="btn btn-primary"
                    on:click={closeModal}
                    data-app-insights-event-name="file-manager-close-button-clicked"
                    >{$translate('page.fileManager.modal.close.value')}</button
                >
            </div>
        </form>
    {:else}
        <form class="modal-box">
            <h3 class="text-lg font-bold">{$translate('page.fileManager.modal.title.value')}</h3>
            <div class="divider" />
            <p class="py-4">
                {$translate('page.fileManager.modal.description.value', {
                    values: {
                        downloadSize: convertToReadableSize($downloadData.totalSizeToDownload),
                    },
                })}
            </p>
            <p class="mb-8 py-4">{$translate('page.fileManager.modal.question.value')}</p>
            <div class="flex justify-end">
                <button
                    class="btn btn-neutral me-4"
                    on:click={cancelUpdateFiles}
                    data-app-insights-event-name="file-manager-cancel-update-button-clicked"
                    >{$translate('page.fileManager.cancel.value')}</button
                >
                <button
                    class="btn btn-primary"
                    disabled={$downloadData.urlsToDelete.length === 0 && $downloadData.urlsToDownload.length === 0}
                    on:click={continueUpdateFiles}
                    data-app-insights-event-name="file-manager-continue-update-button-clicked"
                    >{$translate('page.fileManager.update.value')}</button
                >
            </div>
        </form>
    {/if}
    <form method="dialog" class="modal-backdrop">
        <button data-app-insights-event-name="file-manager-close-button-clicked">close</button>
    </form>
</dialog>
