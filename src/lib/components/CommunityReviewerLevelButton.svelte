<script lang="ts">
    import { isShowingCommunityEditionModal } from '$lib/stores/community-edition-modal.store';

    const openCommunityModal = (event: Event) => {
        event.stopPropagation();
        $isShowingCommunityEditionModal = true;
    };
</script>

<button class="flex h-full w-auto justify-end" on:click={openCommunityModal}>
    <img class="ms-2 h-6 w-auto object-contain" src="/Community_150x150.png" alt="Community Reviewer Icon" />
</button>
