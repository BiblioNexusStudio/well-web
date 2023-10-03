<script lang="ts">
    import ViewHeader from './ViewHeader.svelte';
    import ViewRow from './ViewRow.svelte';
    import { biblesModuleBook } from '$lib/stores/file-manager.store';
    import type { ApiAudioChapter } from '$lib/types/file-manager';

    let audioChapters: ApiAudioChapter[] = $biblesModuleBook.audioUrls.chapters || [];
</script>

<table class="w-full">
    <ViewHeader />
    <tbody>
        {#each audioChapters as audioChapter}
            <ViewRow {audioChapter} />
        {/each}
    </tbody>
</table>
