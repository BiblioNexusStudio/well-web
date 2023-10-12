<script lang="ts">
    import { onMount } from 'svelte';
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { addFrontEndDataToBiblesModuleBook } from '$lib/utils/file-manager';
    import { selectedBookCode, biblesModuleData, biblesModuleBook } from '$lib/stores/file-manager.store';

    let lanaguageMenuDiv: HTMLElement;
    let menuOpen = false;
    let firstBible = $biblesModuleData[0] || { id: null, contents: [] };

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

<div class="flex h-full items-center relative w-full" bind:this={lanaguageMenuDiv}>
    <button
        class="btn btn-primary btn-outline flex justify-between w-full"
        on:click={toggleMenu}
        aria-label={$translate('page.fileManager.selectABook.value')}
    >
        {bookName}
        <Icon data={menuOpen ? caretUp : caretDown} />
    </button>
    {#if menuOpen}
        <div
            class="flex flex-col flex-nowrap overflow-y-scroll absolute top-16 left-0 border-2-primary bg-white shadow-lg rounded-md menu z-30 p-4 space-y-8"
        >
            {#each firstBible.books as book}
                <button
                    type="button"
                    class="flex justify-start ml-8 text-primary"
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
        height: 66vh;
        border: 2px solid #b5ac8b;
    }
</style>
