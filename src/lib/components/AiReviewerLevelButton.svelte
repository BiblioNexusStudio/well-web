<script lang="ts">
    import { isShowingAiEditionModal } from '$lib/stores/ai-edition-modal.store';
    import BlueAiIcon from '$lib/icons/BlueAiIcon.svelte';

    const openAiModal = (event: Event) => {
        event.stopPropagation();
        $isShowingAiEditionModal = true;
    };
</script>

<button class="h-6 w-6" on:click={openAiModal}>
    <BlueAiIcon />
</button>
