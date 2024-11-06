<script lang="ts">
    import { isShowingAiEditionModal } from '$lib/stores/ai-edition-modal.store';
    import BlueAiIcon from '$lib/icons/BlueAiIcon.svelte';

    const openAiModal = (event: Event) => {
        event.stopPropagation();
        $isShowingAiEditionModal = true;
    };
</script>

<button class="flex h-auto w-6 justify-end" on:click={openAiModal}>
    <BlueAiIcon />
</button>
