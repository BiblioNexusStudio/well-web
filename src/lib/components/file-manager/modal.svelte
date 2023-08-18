<script lang="ts">
    const continueUpdateFiles = () => {
        console.log('continueUpdateFiles');
    };

    const cancelUpdateFiles = () => {
        const modal = document.getElementById('file-manager-modal') as HTMLDialogElement;
        if (modal) {
            modal.close();
        }
        console.log('cancelUpdateFiles');
    };
</script>

<dialog id="file-manager-modal" class="modal">
    <form class="modal-box">
        <h3 class="font-bold text-lg">Confirmation</h3>
        <div class="divider" />
        <p class="py-4">
            You are about to download 3.2 MB and delete 488 kb of content from your device.
        </p>
        <p class="py-4 mb-8">How would you like to proceed?</p>
        <div class="flex justify-end">
            <button class="btn btn-neutral mr-4" on:click={cancelUpdateFiles}>Cancel</button>
            <button class="btn btn-primary" on:click={continueUpdateFiles}>Continue</button>
        </div>
    </form>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
