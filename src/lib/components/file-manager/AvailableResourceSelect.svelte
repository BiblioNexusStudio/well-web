<script lang="ts">
    import { bibleData, currentBibleVersion, tableType } from '$lib/stores/file-manager.store';

    const onAvailableResourceSelected = (event: any) => {
        const { value } = event.target as HTMLSelectElement;

        if (value === 'resources') {
            $tableType = 'resources';
        } else {
            const book = $bibleData.find((b) => b.languageId == value);
            if (book) {
                $currentBibleVersion = book;
            }
            $tableType = 'bible';
        }
    };
</script>

<div class="form-control w-full max-w-xs">
    <label class="label" for="availableResourceSelect">
        <span class="label-text">Choose a Resource</span>
    </label>
    <select
        class="select select-primary w-full max-w-xs"
        on:change={onAvailableResourceSelected}
        bind:value={$currentBibleVersion.languageId}
        id="availableResourceSelect"
    >
        <option value="" disabled selected>Please select a resource</option>
        <option value="resources">CBBT-ER</option>
        {#each $bibleData as bibleBook}
            <option value={bibleBook.languageId}>{bibleBook.name}</option>
        {/each}
    </select>
</div>
