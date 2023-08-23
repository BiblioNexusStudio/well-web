<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { currentBibleVersion } from '$lib/stores/file-manager.store';
    import { convertToReadableSize, addUrlToDownloads, addUrlToDelete } from '$lib/utils/fileManager';
    import type { BibleVersionBookContent } from '$lib/types/fileManager';
    import Icon from 'svelte-awesome';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import chevronDown from 'svelte-awesome/icons/chevronDown';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';

    const selectedAllContentsOfBook = (book: BibleVersionBookContent) => {
        if (book.selected) {
            book.selected = false;
            book.textSelected = false;
            addUrlToDelete(book.textUrl, book.textSize);
            book.audioUrls.chapters.forEach((chapter) => {
                chapter.selected = false;
                addUrlToDelete(chapter[audioFileTypeForBrowser()].url, chapter[audioFileTypeForBrowser()].size);
            });
            return;
        } else {
            book.selected = true;
            book.textSelected = true;
            addUrlToDownloads(book.textUrl, book.textSize);
            book.audioUrls.chapters.forEach((chapter) => {
                chapter.selected = true;
                addUrlToDownloads(chapter[audioFileTypeForBrowser()].url, chapter[audioFileTypeForBrowser()].size);
            });
        }
    };
</script>

<table class="table">
    <!-- head -->
    <thead>
        <tr>
            <th>{$translate('page.fileManager.download.value')}</th>
            <th>{$translate('page.fileManager.book.value')}</th>
            <th>{$translate('page.fileManager.size.value')}</th>
            <th>{$translate('page.fileManager.expand.value')}</th>
        </tr>
    </thead>

    <tbody>
        {#each $currentBibleVersion.contents as book}
            <tr>
                <td>
                    <label>
                        <input
                            type="checkbox"
                            on:click={() => selectedAllContentsOfBook(book)}
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
                        <button class="btn btn-primary btn-sm" on:click={() => (book.expanded = !book.expanded)}>
                            <Icon class="cursor-pointer text-white" data={book.expanded ? chevronUp : chevronDown} />
                        </button>
                    </td>
                {:else}
                    <td />
                {/if}
            </tr>
            {#if book.expanded}
                <tr class="bg-secondary text-neutral">
                    <td class="font-bold">{$translate('page.fileManager.download.value')}</td>
                    <td class="font-bold">{$translate('page.fileManager.type.value')}</td>
                    <td class="font-bold">{$translate('page.fileManager.size.value')}</td>
                    <td />
                </tr>
                {#if book.textUrl}
                    <tr class="bg-primary">
                        <td>
                            <label>
                                <input
                                    type="checkbox"
                                    on:click={() =>
                                        book.textSelected
                                            ? addUrlToDelete(book.textUrl, book.textSize)
                                            : addUrlToDownloads(book.textUrl, book.textSize)}
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
                        <tr class="bg-primary">
                            <td>
                                <label>
                                    <input
                                        type="checkbox"
                                        on:click={() =>
                                            audioChapter.selected
                                                ? addUrlToDelete(
                                                      audioChapter[audioFileTypeForBrowser()].url,
                                                      audioChapter[audioFileTypeForBrowser()].size
                                                  )
                                                : addUrlToDownloads(
                                                      audioChapter[audioFileTypeForBrowser()].url,
                                                      audioChapter[audioFileTypeForBrowser()].size
                                                  )}
                                        bind:checked={audioChapter.selected}
                                        class="checkbox checkbox-secondary"
                                    />
                                </label>
                            </td>
                            <td> Audio Chapter {audioChapter.number} </td>
                            <td> {convertToReadableSize(audioChapter[audioFileTypeForBrowser()].size)} </td>
                            <td />
                        </tr>
                    {/each}
                {/if}
            {/if}
        {/each}
    </tbody>
</table>
