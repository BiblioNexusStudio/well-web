<script lang="ts">
    import { downloadData } from '$lib/stores/file-manager.store';
    import { convertToReadableSize, resetDownloadData } from '$lib/utils/file-manager';
    import { removeFromCdnCache, cacheManyFromCdnWithProgress, type AllItemsProgress } from '$lib/data-cache';

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
</script>

<dialog id="file-manager-modal" class="modal">
    {#if downloadInProgress}
        <form class="modal-box">
            <h3 class="font-bold text-lg">Download Progress</h3>
            <div class="divider" />
            <p class="mb-2">
                Downloading {convertToReadableSize(totalSizeDownloaded)} of {convertToReadableSize(
                    totalSizeToDownload
                )}.
            </p>
            <progress
                class="progress progress-primary w-100 mb-4"
                value={totalSizeDownloaded}
                max={totalSizeToDownload}
            />
            <div class="flex justify-end">
                <button class="btn btn-primary" on:click={cancelUpdateFiles}>Cancel</button>
            </div>
        </form>
    {:else if downloadedSuccessfully && !downloadInProgress}
        <form class="modal-box">
            <h3 class="font-bold text-lg">Downloaded Successfully</h3>
            <div class="divider" />
            <div class="flex justify-end">
                <button class="btn btn-primary" on:click={closeModal}>Close</button>
            </div>
        </form>
    {:else}
        <form class="modal-box">
            <h3 class="font-bold text-lg">Confirmation</h3>
            <div class="divider" />
            <p class="py-4">
                You are about to download {convertToReadableSize($downloadData.totalSizeToDownload)} and delete {convertToReadableSize(
                    $downloadData.totalSizeToDelete
                )} of content from your device.
            </p>
            <p class="py-4 mb-8">How would you like to proceed?</p>
            <div class="flex justify-end">
                <button class="btn btn-neutral mr-4" on:click={cancelUpdateFiles}>Cancel</button>
                <button
                    class="btn btn-primary"
                    disabled={$downloadData.totalSizeToDownload === 0 && $downloadData.totalSizeToDelete === 0}
                    on:click={continueUpdateFiles}>Continue</button
                >
            </div>
        </form>
    {/if}
</dialog>
