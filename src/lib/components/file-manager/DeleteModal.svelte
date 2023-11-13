<script lang="ts">
    import { removeFromCdnCache } from '$lib/data-cache';
    import { _ as translate } from 'svelte-i18n';
    import { downloadData, biblesModuleBook } from '$lib/stores/file-manager.store';

    const cancelDelete = () => {
        const modal = document.getElementById('file-manager-delete-modal') as HTMLDialogElement;
        if (modal) {
            modal.close();
        }
    };

    const deleteFiles = () => {
        $downloadData.urlsToDelete.forEach((url) => {
            removeFromCdnCache(url);
        });

        $biblesModuleBook.audioUrls.chapters = $biblesModuleBook.audioUrls.chapters.map((chapter) => {
            if (chapter.selected && chapter.deleteResources) {
                chapter.deleteResources = false;
                chapter.selected = false;
                chapter.isAudioUrlCached = false;
                chapter.allUrlsCached = false;

                chapter.resourceMenuItems?.forEach((resource) => {
                    resource.isResourceUrlCached = false;
                });
            }

            return chapter;
        });

        const modal = document.getElementById('file-manager-delete-modal') as HTMLDialogElement;

        if (modal) {
            modal.close();
        }
    };
</script>

<dialog id="file-manager-delete-modal" class="modal">
    <form class="modal-box">
        <h3 class="text-lg font-bold">{$translate('page.fileManager.deleteModal.warning.value')}</h3>
        <div class="divider" />
        <p class="mb-6">{$translate('page.fileManager.deleteModal.description.value')}</p>
        <div class="flex justify-between">
            <button class="btn" on:click={deleteFiles}>{$translate('page.fileManager.delete.value')}</button>
            <button class="btn btn-primary" on:click={cancelDelete}
                >{$translate('page.fileManager.cancel.value')}</button
            >
        </div>
    </form>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
