<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { bibleData, currentBibleVersion } from '$lib/stores/file-manager.store';
    import { convertToReadableSize } from '$lib/utils/file-manager';
    import type { FrontendBibleVersionBookContent } from '$lib/types/file-manager';
    import Icon from 'svelte-awesome';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import chevronDown from 'svelte-awesome/icons/chevronDown';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';

    const selectedAllContentsOfBook = (book: FrontendBibleVersionBookContent) => {
        if (book.selected) {
            book.selected = false;
            book.textSelected = false;
            book.audioUrls.chapters.forEach((chapter) => {
                chapter.selected = false;
            });
        } else {
            book.selected = true;
            book.textSelected = true;
            book.audioUrls.chapters.forEach((chapter) => {
                chapter.selected = true;
            });
        }
        $bibleData = $bibleData;
    };
</script>

<table class="table">
    <!-- head -->
    <thead>
        <tr>
            <th id="select-all-book-contents">{$translate('page.fileManager.download.value')}</th>
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
                            aria-labelledby="select-all-book-contents"
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
                        <button
                            class="btn btn-primary btn-sm"
                            aria-label={book.expanded
                                ? $translate('page.fileManager.a11y.collapseResources.value', {
                                      values: {
                                          bookName: book.displayName,
                                      },
                                  })
                                : $translate('page.fileManager.a11y.expandResources.value', {
                                      values: {
                                          bookName: book.displayName,
                                      },
                                  })}
                            on:click={() => (book.expanded = !book.expanded)}
                        >
                            <Icon class="cursor-pointer text-white" data={book.expanded ? chevronUp : chevronDown} />
                        </button>
                    </td>
                {:else}
                    <td />
                {/if}
            </tr>
            {#if book.expanded}
                <tr class="bg-secondary text-neutral">
                    <td id="select-one-book-resource" class="font-bold"
                        >{$translate('page.fileManager.download.value')}</td
                    >
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
                                    aria-labelledby="select-one-book-resource"
                                    on:click={() => {
                                        book.textSelected = !book.textSelected;
                                        $bibleData = $bibleData;
                                    }}
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
                                        aria-labelledby="select-one-book-resource"
                                        on:click={() => {
                                            audioChapter.selected = !audioChapter.selected;
                                            $bibleData = $bibleData;
                                        }}
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
