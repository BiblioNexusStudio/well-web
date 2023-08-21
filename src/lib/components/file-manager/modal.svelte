<script lang="ts">
    import { downloadData, bibleData, bibleDataClone, currentBibleBook } from '$lib/stores/file-manager.store';
    import { convertToReadableSize } from '$lib/utils/fileManager';
    import { removeFromCdnCache, cacheManyFromCdnWithProgress } from '$lib/data-cache';

    let downloadInProgress = false;
    let totalSizeToDownload = 1;
    let totalSizeDownloaded = 0;

    const continueUpdateFiles = () => {
        $downloadData.urlsToDelete.forEach((url) => {
            removeFromCdnCache(url);
        });
        $downloadData.urlsToDelete = [];
        $downloadData.totalSizeToDelete = 0;
        cacheManyFromCdnWithProgress($downloadData.urlsToDownload, progressCallback);
        $downloadData.urlsToDownload = [];
        $downloadData.totalSizeToDownload = 0;
        downloadInProgress = true;
    };

    const progressCallback = (progress: any) => {
        Object.keys(progress).forEach((key: string) => {
            const p = progress[key];
            totalSizeToDownload = totalSizeToDownload + p.totalSize;
            totalSizeDownloaded = totalSizeDownloaded + p.downloadedSize;
        });

        downloadInProgress = Object.keys(progress).some((key: string) => {
            const p = progress[key];
            if (p.done === false) {
                return true;
            }
            return false;
        });

        if (!downloadInProgress) {
            const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
            if (modal) {
                modal.close();
            }
        }
    };

    const cancelUpdateFiles = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;

        $bibleData = $bibleDataClone;
        const matchingBook = $bibleData.find((b) => b.languageId == $currentBibleBook.languageId);
        if (matchingBook) {
            $currentBibleBook = matchingBook;
        }
        if (modal) {
            modal.close();
        }
    };
</script>

<dialog id="file-manager-modal" class="modal">
    {#if downloadInProgress}
        <form class="modal-box">
            <h3 class="font-bold text-lg">Download Progress</h3>
            <div class="divider" />
            <progress class="progress progress-primary w-56" value={totalSizeDownloaded} max={totalSizeToDownload} />
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
