<script lang="ts">
    import { isShowingCommunityEditionModal } from '$lib/stores/community-edition-modal.store';
    import BlueCommunityIcon from '$lib/icons/BlueCommunityIcon.svelte';

    const openCommunityModal = (event: Event) => {
        event.stopPropagation();
        $isShowingCommunityEditionModal = true;
    };
</script>

<button class="h-6 w-6" on:click={openCommunityModal}>
    <BlueCommunityIcon />
</button>
