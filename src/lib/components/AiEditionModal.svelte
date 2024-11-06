<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import { isShowingAiEditionModal } from '$lib/stores/ai-edition-modal.store';

    function close() {
        $isShowingAiEditionModal = false;
    }
</script>

<dialog on:close={close} open={$isShowingAiEditionModal} class="modal">
    <div class="modal-box mb-auto mt-16">
        <div class="flex h-full flex-col items-center justify-center">
            <div class="mb-4 flex w-full items-center justify-between">
                <h1 class="text-2xl font-bold text-slate-600">
                    {$translate('components.aiEditionModal.header.value')}
                </h1>
                <button on:click={close}>
                    <XMarkIcon />
                </button>
            </div>

            <div class="prose">
                {@html $translate('components.aiEditionModal.description.value')}
            </div>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
