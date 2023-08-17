<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { currentBibleBook } from '$lib/stores/file-manager.store';
    import { convertToReadableSize } from '$lib/utils/fileManager';
    import type { BibleBook as BibleBookType } from '$lib/types/bible';
    import Icon from 'svelte-awesome';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import chevronDown from 'svelte-awesome/icons/chevronDown';

    const selectedAllContentsOfBook = (book: BibleBookType) => {
        if (book.select) {
            book.select = false;
            book.textSelected = false;
            book.audioUrls.chapters.forEach((chapter) => (chapter.selected = false));
            return;
        } else {
            book.select = true;
            book.textSelected = true;
            book.audioUrls.chapters.forEach((chapter) => (chapter.selected = true));
        }
    };
</script>

<table class="table">
    <!-- head -->
    <thead>
        <tr>
            <th>{$translate('page.index.download.value')}</th>
            <th>{$translate('page.index.book.value')}</th>
            <th>{$translate('page.index.size.value')}</th>
            <th>{$translate('page.index.expand.value')}</th>
        </tr>
    </thead>

    <tbody>
        {#each $currentBibleBook.contents as book}
            <tr>
                <td>
                    <label>
                        <input
                            type="checkbox"
                            on:click={selectedAllContentsOfBook(book)}
                            bind:checked={book.selected}
                            class="checkbox checkbox-primary"
                        />
                    </label>
                </td>
                <td>
                    <div class="flex items-center space-x-3">
                        <div>
                            <div class="font-bold">{book.displayName}</div>
                        </div>
                    </div>
                </td>
                <td>
                    {convertToReadableSize(book.audioSize + book.textSize)}
                </td>
                {#if book.textSize > 1 || book.audioSize > 1}
                    <td>
                        <button
                            class="btn btn-primary btn-sm"
                            on:click={() => (book.expanded = !book.expanded)}
                        >
                            <Icon
                                class="cursor-pointer text-white"
                                data={book.expanded ? chevronUp : chevronDown}
                            />
                        </button>
                    </td>
                {:else}
                    <td />
                {/if}
            </tr>
            {#if book.expanded}
                <tr class="bg-secondary text-neutral">
                    <td class="font-bold">{$translate('page.index.download.value')}</td>
                    <td class="font-bold">{$translate('page.index.type.value')}</td>
                    <td class="font-bold">{$translate('page.index.size.value')}</td>
                    <td />
                </tr>
                {#if book.textUrl}
                    <tr class="bg-primary text-neutral">
                        <td>
                            <label>
                                <input
                                    type="checkbox"
                                    bind:checked={book.textSelected}
                                    class="checkbox checkbox-secondary"
                                />
                            </label>
                        </td>
                        <td> Text </td>
                        <td> {convertToReadableSize(book.textSize)} </td>
                        <td />
                    </tr>
                {/if}
                {#if book.audioUrls.chapters.length > 0}
                    {#each book.audioUrls.chapters as audioChapter}
                        <tr class="bg-primary text-neutral">
                            <td>
                                <label>
                                    <input
                                        type="checkbox"
                                        bind:checked={audioChapter.selected}
                                        class="checkbox checkbox-secondary"
                                    />
                                </label>
                            </td>
                            <td> Audio Chapter {audioChapter.number} </td>
                            <td> {convertToReadableSize(audioChapter.webm.size)} </td>
                            <td />
                        </tr>
                    {/each}
                {/if}
            {/if}
        {/each}
    </tbody>
</table>
