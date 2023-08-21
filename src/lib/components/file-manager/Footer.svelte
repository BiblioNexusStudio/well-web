<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { resetDownloadData } from '$lib/utils/fileManager';
    import { bibleData, bibleDataClone, downloadData, currentBibleBook } from '$lib/stores/file-manager.store';

    const updateFiles = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
        if (modal) {
            modal.showModal();
        }
    };

    const cancelUpdateFiles = () => {
        $bibleData = $bibleDataClone;
        const matchingBook = $bibleData.find((b) => b.languageId == $currentBibleBook.languageId);
        if (matchingBook) {
            $currentBibleBook = matchingBook;
        }
        resetDownloadData();
    };
</script>

<footer class="footer footer-center p-4 bg-base-300 text-base-content fixed bottom-0 left-0">
    <div class="container mx-auto flex justify-between">
        <div>
            <a href="/"><button class="btn btn-neutral">{$translate('page.index.back.value')}</button></a>
        </div>
        <div class="flex">
            <button class="btn btn-neutral" on:click={cancelUpdateFiles}>{$translate('page.index.cancel.value')}</button
            >
            <button
                class="btn btn-primary ml-4"
                disabled={$downloadData.totalSizeToDownload === 0 && $downloadData.totalSizeToDelete === 0}
                on:click={updateFiles}>{$translate('page.index.update.value')}</button
            >
        </div>
    </div>
</footer>
