<script lang="ts">
    import { onMount } from 'svelte';
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { addFrontEndDataToBiblesModuleBook } from '$lib/utils/file-manager';
    import {
        selectedBookCode,
        biblesModuleData,
        biblesModuleBook,
        isLoadingLanguageFirstBible,
    } from '$lib/stores/file-manager.store';
    import { bookOfBibleEndpoint } from '$lib/api-endpoints';

    let bookMenuDiv: HTMLElement;
    let menuOpen = false;
    let firstBible = $biblesModuleData[0] || { id: null, contents: [], books: [] };

    $: books = firstBible.books;
    $: bookName = setBookName($selectedBookCode);

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const handleBookClick = async (bookCode: string | null) => {
        $isLoadingLanguageFirstBible = true;
        toggleMenu();
        $biblesModuleBook = await addFrontEndDataToBiblesModuleBook(
            firstBible.id,
            await fetchFromCacheOrApi(...bookOfBibleEndpoint(firstBible.id, bookCode))
        );
        $biblesModuleBook.bibleId = firstBible.id;
        $selectedBookCode = bookCode;
        $isLoadingLanguageFirstBible = false;
    };

    const setBookName = (bookCode: string | null) => {
        const book = firstBible.books.find((book) => book.bookCode === bookCode);
        return book ? `${book.displayName} (${book.bookCode})` : $translate('page.fileManager.selectABook.value');
    };

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bookMenuDiv && !bookMenuDiv.contains(event.target as Node) && menuOpen) {
                toggleMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div class="relative flex h-full w-full items-center" bind:this={bookMenuDiv}>
    <button
        class="btn btn-outline btn-primary flex w-full justify-between"
        on:click={toggleMenu}
        aria-label={$translate('page.fileManager.selectABook.value')}
        data-app-insights-event-name="file-manager-book-menu-selected"
    >
        {bookName}
        <Icon data={menuOpen ? caretUp : caretDown} />
    </button>
    {#if menuOpen}
        <div
            class="menu absolute left-0 top-16 z-30 flex flex-col flex-nowrap space-y-8 overflow-y-scroll rounded-md border-2 border-primary-300 bg-white p-4 shadow-lg"
            style="height: min(66vh, calc({books.length * 3.25}rem + 4px)); width: {bookMenuDiv.clientWidth}px;"
        >
            {#each books as book}
                <button
                    type="button"
                    class="flex justify-start text-primary"
                    aria-label={book.displayName}
                    on:click={() => handleBookClick(book.bookCode)}
                    data-app-insights-event-name="file-manager-book-selected"
                >
                    {book.displayName} ({book.bookCode})
                </button>
            {/each}
        </div>
    {/if}
</div>
