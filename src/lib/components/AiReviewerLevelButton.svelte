<script lang="ts">
    import { isShowingAiEditionModal } from '$lib/stores/ai-edition-modal.store';

    const openAiModal = (event: Event) => {
        event.stopPropagation();
        $isShowingAiEditionModal = true;
    };
</script>

<button class="flex h-full w-auto justify-end" on:click={openAiModal}>
    <img class="ms-2 h-6 w-auto object-contain" src="/Ai_150x150.png" alt="Ai Reviewer Icon" />
</button>
