<script lang="ts">
    import { removeFromContentCache } from '$lib/data-cache';
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
            removeFromContentCache(url);
        });

        if ($biblesModuleBook.audioUrls) {
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
        }

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
            <button
                class="btn"
                on:click={deleteFiles}
                data-app-insights-event-name="file-manager-delete-files-button-clicked"
                >{$translate('page.fileManager.delete.value')}</button
            >
            <button
                class="btn btn-primary"
                on:click={cancelDelete}
                data-app-insights-event-name="file-manager-cancel-delete-button-clicked"
                >{$translate('page.fileManager.cancel.value')}</button
            >
        </div>
    </form>
    <form method="dialog" class="modal-backdrop">
        <button data-app-insights-event-name="file-manager-close-button-clicked">close</button>
    </form>
</dialog>
