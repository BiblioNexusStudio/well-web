<script lang="ts">
    import { goto } from '$app/navigation';
    import { _ as translate } from 'svelte-i18n';
    import { resetDownloadData } from '$lib/utils/file-manager';
    import {
        bibleData,
        bibleDataClone,
        downloadData,
        currentBibleVersion,
        passageData,
        passageDataClone,
    } from '$lib/stores/file-manager.store';

    const updateFiles = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
        if (modal) {
            modal.showModal();
        }
    };

    const cancelUpdateFiles = () => {
        $bibleData = $bibleDataClone;
        const matchingBook = $bibleData.find((b) => b.languageId == $currentBibleVersion.languageId);
        if (matchingBook) {
            $currentBibleVersion = matchingBook;
        }
        $passageData = $passageDataClone;
        resetDownloadData();
        goto('/');
    };
</script>

<footer class="footer footer-center p-4 bg-base-300 text-base-content fixed bottom-0 left-0">
    <div class="container mx-auto flex justify-between">
        <div>
            <button on:click={cancelUpdateFiles} class="btn btn-neutral"
                >{$translate('page.fileManager.back.value')}</button
            >
        </div>
        <div class="flex">
            <button class="btn btn-neutral" on:click={cancelUpdateFiles}
                >{$translate('page.fileManager.cancel.value')}</button
            >
            <button
                class="btn btn-primary ml-4"
                disabled={$downloadData.totalSizeToDownload === 0 && $downloadData.totalSizeToDelete === 0}
                on:click={updateFiles}>{$translate('page.fileManager.update.value')}</button
            >
        </div>
    </div>
</footer>
