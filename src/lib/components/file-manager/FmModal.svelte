<script lang="ts">
    import { downloadData } from '$lib/stores/file-manager.store';
    import { convertToReadableSize, resetDownloadData } from '$lib/utils/file-manager';
    import { removeFromCdnCache, cacheManyFromCdnWithProgress, type AllItemsProgress } from '$lib/data-cache';
    import { _ as translate } from 'svelte-i18n';

    let downloadInProgress = false;
    let downloadedSuccessfully = false;
    let totalSizeToDownload = 1;
    let totalSizeDownloaded = 0;

    const continueUpdateFiles = () => {
        if ($downloadData.urlsToDelete.length > 0) {
            $downloadData.urlsToDelete.forEach((url) => {
                removeFromCdnCache(url);
            });
        }

        if ($downloadData.urlsToDownload.length > 0) {
            cacheManyFromCdnWithProgress($downloadData.urlsToDownload, progressCallback);
            downloadInProgress = true;
        } else {
            const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
            if (modal) {
                modal.close();
                resetDownloadData();
            }
        }
    };

    const progressCallback = (progress: AllItemsProgress) => {
        [totalSizeToDownload, totalSizeDownloaded] = Object.values(progress).reduce(
            ([runningTotal, runningDownloaded], { downloadedSize, totalSize }) => [
                runningTotal + totalSize,
                runningDownloaded + downloadedSize,
            ],
            [0, 0]
        );
        const downloadFinished = Object.keys(progress).every((key: string) => progress[key].done);

        if (downloadFinished) {
            downloadInProgress = false;
            resetDownloadData();
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
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
        if (modal) {
            modal.close();
            downloadInProgress = false;
            $downloadData.queue = [];
            $downloadData.abortController.abort();
        }
    };
</script>

<dialog id="file-manager-modal" class="modal">
    {#if downloadInProgress}
        <form class="modal-box">
            <h3 class="font-bold text-lg">{$translate('page.fileManager.modal.downloadProgress.value')}</h3>
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
                class="progress progress-primary w-100 mb-4"
                value={totalSizeDownloaded}
                max={totalSizeToDownload}
            />
            <div class="flex justify-end">
                <button class="btn btn-primary" on:click={cancelCurrentDownload}
                    >{$translate('page.fileManager.cancel.value')}</button
                >
            </div>
        </form>
    {:else if downloadedSuccessfully && !downloadInProgress}
        <form class="modal-box">
            <h3 class="font-bold text-lg">{$translate('page.fileManager.modal.success.value')}</h3>
            <div class="divider" />
            <div class="flex justify-end">
                <button class="btn btn-primary" on:click={closeModal}
                    >{$translate('page.fileManager.modal.close.value')}</button
                >
            </div>
        </form>
    {:else}
        <form class="modal-box">
            <h3 class="font-bold text-lg">{$translate('page.fileManager.modal.title.value')}</h3>
            <div class="divider" />
            <p class="py-4">
                {$translate('page.fileManager.modal.description.value', {
                    values: {
                        downloadSize: convertToReadableSize($downloadData.totalSizeToDownload),
                        deleteSize: convertToReadableSize($downloadData.totalSizeToDelete),
                    },
                })}
            </p>
            <p class="py-4 mb-8">{$translate('page.fileManager.modal.question.value')}</p>
            <div class="flex justify-end">
                <button class="btn btn-neutral mr-4" on:click={cancelUpdateFiles}
                    >{$translate('page.fileManager.cancel.value')}</button
                >
                <button
                    class="btn btn-primary"
                    disabled={$downloadData.totalSizeToDownload === 0 && $downloadData.totalSizeToDelete === 0}
                    on:click={continueUpdateFiles}>{$translate('page.fileManager.update.value')}</button
                >
            </div>
        </form>
    {/if}
</dialog>
