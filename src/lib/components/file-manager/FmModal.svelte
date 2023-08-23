<script lang="ts">
    import { downloadData, bibleData, bibleDataClone, currentBibleVersion } from '$lib/stores/file-manager.store';
    import { convertToReadableSize, resetDownloadData } from '$lib/utils/fileManager';
    import { removeFromCdnCache, cacheManyFromCdnWithProgress, type AllItemsProgress } from '$lib/data-cache';
    import { _ as translate } from 'svelte-i18n';

    let downloadInProgress = false;
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
            const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
            if (modal) {
                modal.close();
                downloadInProgress = false;
                resetDownloadData();
            }
        }
    };

    const cancelUpdateFiles = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;

        $bibleData = $bibleDataClone;
        const matchingBook = $bibleData.find((b) => b.languageId == $currentBibleVersion.languageId);
        if (matchingBook) {
            $currentBibleVersion = matchingBook;
        }
        resetDownloadData();
        if (modal) {
            modal.close();
        }
    };
</script>

<dialog id="file-manager-modal" class="modal">
    {#if downloadInProgress}
        <form class="modal-box">
            <h3 class="font-bold text-lg">{$translate('page.fileManager.modal.downloadProgress.value')}</h3>
            <div class="divider" />
            <progress class="progress progress-primary w-100" value={totalSizeDownloaded} max={totalSizeToDownload} />
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
