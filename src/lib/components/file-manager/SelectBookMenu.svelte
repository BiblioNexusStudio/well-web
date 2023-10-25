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
        limitChaptersIfNecessary,
        allowedBooks,
    } from '$lib/stores/file-manager.store';

    let lanaguageMenuDiv: HTMLElement;
    let menuOpen = false;
    let firstBible = $biblesModuleData[0] || { id: null, contents: [] };

    $: books = firstBible.books.filter((book) => allowedBooks.includes(book.bookCode));
    $: bookName = setBookName($selectedBookCode);

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const handleBookClick = async (bookCode: string | null) => {
        toggleMenu();
        $biblesModuleBook = await addFrontEndDataToBiblesModuleBook(
            await fetchFromCacheOrApi(`bibles/${firstBible.id}/book/${bookCode}`)
        );
        $selectedBookCode = bookCode;
        limitChaptersIfNecessary(bookCode, biblesModuleBook);
    };

    const setBookName = (bookCode: string | null) => {
        const book = firstBible.books.find((book) => book.bookCode === bookCode);
        return book ? `${book.displayName} (${book.bookCode})` : $translate('page.fileManager.selectABook.value');
    };

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (lanaguageMenuDiv && !lanaguageMenuDiv.contains(event.target as Node) && menuOpen) {
                toggleMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div class="relative flex h-full w-full items-center" bind:this={lanaguageMenuDiv}>
    <button
        class="btn btn-primary btn-outline flex w-full justify-between"
        on:click={toggleMenu}
        aria-label={$translate('page.fileManager.selectABook.value')}
    >
        {bookName}
        <Icon data={menuOpen ? caretUp : caretDown} />
    </button>
    {#if menuOpen}
        <div
            class="border-2-primary menu absolute left-0 top-16 z-30 flex flex-col flex-nowrap space-y-8 overflow-y-scroll rounded-md bg-white p-4 shadow-lg"
            style="height: min(66vh, calc({books.length * 3.25}rem + 4px))"
        >
            {#each books as book}
                <button
                    type="button"
                    class="ml-8 flex justify-start text-primary"
                    aria-label={book.displayName}
                    on:click={() => handleBookClick(book.bookCode)}
                >
                    {book.displayName} ({book.bookCode})
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .menu {
        width: calc(100vw - 2rem);
        border: 2px solid #80d4f3;
    }
</style>
