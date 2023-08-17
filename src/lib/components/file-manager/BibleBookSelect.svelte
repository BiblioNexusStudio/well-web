<script lang="ts">
    import { bibleData, currentBibleBook } from '$lib/stores/file-manager.store';

    const onBibleBookSelected = (e: any) => {
        const { value } = e.target;
        const book = $bibleData.find((b) => b.languageId == value);
        if (book) {
            $currentBibleBook = book;
        }
    };
</script>

<div class="form-control w-full max-w-xs">
    <label class="label" for="bibleBookSelect">
        <span class="label-text">Choose a Book</span>
    </label>
    <select
        class="select select-primary w-full max-w-xs"
        on:change={onBibleBookSelected}
        bind:value={$currentBibleBook.languageId}
        id="bibleBookSelect"
    >
        <option value="" disabled selected>Please select a book</option>
        {#each $bibleData as bibleBook}
            <option value={bibleBook.languageId}>{bibleBook.name}</option>
        {/each}
    </select>
</div>
