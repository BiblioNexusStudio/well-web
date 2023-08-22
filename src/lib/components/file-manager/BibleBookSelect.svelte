<script lang="ts">
    import { bibleData, currentBibleBook, tableType } from '$lib/stores/file-manager.store';

    const onBibleBookSelected = (e: any) => {
        const { value } = e.target;

        if (value === 'resources') {
            $tableType = 'resources';
        } else {
            const book = $bibleData.find((b) => b.languageId == value);
            if (book) {
                $currentBibleBook = book;
            }
            $tableType = 'bible';
        }
    };
</script>

<div class="form-control w-full max-w-xs">
    <label class="label" for="bibleBookSelect">
        <span class="label-text">Choose a Resource</span>
    </label>
    <select
        class="select select-primary w-full max-w-xs"
        on:change={onBibleBookSelected}
        bind:value={$currentBibleBook.languageId}
        id="bibleBookSelect"
    >
        <option value="" disabled selected>Please select a resource</option>
        <option value="resources">CBBT-ER</option>
        {#each $bibleData as bibleBook}
            <option value={bibleBook.languageId}>{bibleBook.name}</option>
        {/each}
    </select>
</div>
