<script lang="ts">
    import { onMount } from 'svelte';
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import { bibleData, selectedBookId } from '$lib/stores/file-manager.store';

    let lanaguageMenuDiv: HTMLElement;
    let menuOpen = false;
    let firstBible = $bibleData[0] || { contents: [] };

    $: bookName = setBookName($selectedBookId);

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const handleBookClick = (id: number | null) => {
        toggleMenu();
        $selectedBookId = id;
    };

    const setBookName = (bookId: number | null) => {
        const book = firstBible.contents.find((book) => book.bookId === bookId);
        return book ? book.displayName : $translate('page.fileManager.selectABook.value');
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
            {#each firstBible.contents as book}
                <button
                    type="button"
                    class="flex justify-start ml-8 text-primary"
                    aria-label={book.displayName}
                    on:click={() => handleBookClick(book.bookId)}
                >
                    {book.displayName}
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
