<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { CupertinoPane } from 'cupertino-pane';
    import { afterUpdate, onMount } from 'svelte';
    import { bibleChaptersByBookAvailable } from '$lib/utils/data-handlers/bible';
    import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte';
    import { Icon } from 'svelte-awesome';
    import arrowRight from 'svelte-awesome/icons/arrowRight';
    import type { ApiBibleBook, FrontEndVerseForSelectionPane, ApiBibleChapter } from '$lib/types/bible';
    import { selectedBibleSection } from '$lib/stores/passage-form.store';
    import { closeAllPassagePageMenus } from '$lib/stores/passage-page.store';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import type { Language } from '$lib/types/file-manager';

    export let bookChapterSelectorPane: CupertinoPane;
    export let isShowing: boolean;

    let currentBook: ApiBibleBook;
    let currentChapter: ApiBibleChapter | null = null;
    let buttons: HTMLButtonElement[] = [];
    let scrollBehaviorSmooth = false;

    $: availableBooksPromise = fetchAvailableBooks($currentLanguageInfo);

    async function fetchAvailableBooks(_currentLanguageInfo: Language | undefined) {
        return bibleChaptersByBookAvailable();
    }

    let steps = {
        one: {
            title: $translate('page.BookChapterSelectorPane.availableBooks.value'),
            subtitle: '',
            backText: '',
        },
        two: {
            title: $translate('page.BookChapterSelectorPane.book.value'),
            subtitle: $translate('page.BookChapterSelectorPane.selectChapter.value'),
            backText: $translate('page.BookChapterSelectorPane.book.value'),
        },
        three: {
            title: $translate('page.BookChapterSelectorPane.chapter.value'),
            subtitle: $translate('page.BookChapterSelectorPane.selectVerse.value'),
            backText: $translate('page.BookChapterSelectorPane.chapter.value'),
        },
    };

    let currentStep = steps.one;

    function handleBookSelection(book: ApiBibleBook) {
        currentStep = steps.two;
        currentBook = book;
        currentBook.chapters.forEach((chapter) => {
            chapter.verseState = buildVerseSet(chapter.totalVerses, chapter.number);
        });
    }

    function handleChapterSelection(chapter: ApiBibleChapter) {
        currentChapter = chapter;
    }

    function handleGoToVerses() {
        currentStep = steps.three;
    }

    function buildVerseSet(totalVerses: number, chapterNumber: number) {
        return Array.from({ length: totalVerses }, (_, index) => ({
            number: index + 1,
            selected: false,
            chapterNumber,
        }));
    }

    function handleVerseSelection(verse: FrontEndVerseForSelectionPane) {
        const selectedVerses = currentBook.chapters
            .flatMap((c) => c.verseState.filter((v) => v.selected))
            .sort((a, b) => {
                if (a.chapterNumber === b.chapterNumber) {
                    return a.number - b.number;
                }
                return a.chapterNumber - b.chapterNumber;
            });

        if (selectedVerses.length === 0 || (selectedVerses.length === 1 && selectedVerses[0] === verse)) {
            const newChapters = currentBook.chapters.map((chapter) => {
                if (chapter.number === verse.chapterNumber) {
                    chapter.verseState = chapter.verseState.map((v) => {
                        if (v.number === verse.number && v.chapterNumber === verse.chapterNumber) {
                            return { ...v, selected: !v.selected };
                        }
                        return v;
                    });
                }
                return chapter;
            });

            currentBook = { ...currentBook, chapters: newChapters };
            // needed to rerender the view
            currentChapter = currentBook.chapters.find((c) => c.number === currentChapter?.number)!;
            return;
        }

        if (selectedVerses.length > 0) {
            const firstSelectedVerse = selectedVerses[0]!;

            if (selectedVerses.length === 1) {
                currentBook.chapters = currentBook.chapters.map((chapter) => {
                    if (chapter.number === verse.chapterNumber) {
                        chapter.verseState = chapter.verseState.map((v) => {
                            if (v.number >= firstSelectedVerse.number && v.number <= verse.number) {
                                return { ...v, selected: true };
                            }
                            return v;
                        });
                    }
                    return chapter;
                });
            } else {
                const lastSelectedVerse = selectedVerses[selectedVerses.length - 1]!;
                currentBook.chapters = currentBook.chapters.map((chapter) => {
                    if (chapter.number === verse.chapterNumber) {
                        chapter.verseState = chapter.verseState.map((v) => {
                            if (v.number >= firstSelectedVerse.number && v.number <= lastSelectedVerse.number) {
                                return { ...v, selected: false };
                            }
                            return v;
                        });
                    }
                    return chapter;
                });
            }

            currentChapter = currentBook.chapters.find((c) => c.number === currentChapter?.number)!;
        }
    }

    function handleBack() {
        if (currentStep === steps.two) {
            currentStep = steps.one;
        } else if (currentStep === steps.three) {
            currentStep = steps.two;
        }
    }

    function forceToInt(stringOrInt: string | number) {
        if (typeof stringOrInt === 'number') {
            return stringOrInt;
        }
        return parseInt(stringOrInt, 10);
    }

    async function handleVerseGoButton() {
        $selectedBibleSection = {
            bookCode: currentBook.code,
            startChapter: forceToInt(firstSelectedVerse.chapterNumber),
            startVerse: forceToInt(firstSelectedVerse.number),
            endChapter: forceToInt(lastSelectedVerse.chapterNumber),
            endVerse: forceToInt(lastSelectedVerse.number),
        };
        isShowing = false;
        closeAllPassagePageMenus();
    }

    function formatBibleVerseRange(
        bookName: string,
        startChapter: number | string,
        startVerse: number | string,
        endChapter: number | string,
        endVerse: number | string
    ): string {
        let formattedRange: string;

        if (!startChapter && !startVerse && !endChapter && !endVerse) {
            formattedRange = `${bookName}`;
        } else if (startChapter === endChapter) {
            formattedRange = `${bookName} ${startChapter}:${startVerse}-${endVerse}`;
        } else {
            formattedRange = `${bookName} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`;
        }

        return formattedRange;
    }

    onMount(async () => {
        bookChapterSelectorPane = new CupertinoPane('#book-chapter-verse-selector-pane', {
            backdrop: true,
            simulateTouch: false, // prevent weirdness when using mouse
            topperOverflow: false,
            initialBreak: 'top',
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });

        bookChapterSelectorPane.on('onDidDismiss', function () {
            currentStep = steps.one;
            currentChapter = null;
        });
    });

    afterUpdate(() => {
        if (buttons.length && buttons[(currentChapter?.number || 1) - 1]) {
            buttons[(currentChapter?.number || 1) - 1]!.scrollIntoView({
                behavior: scrollBehaviorSmooth ? 'smooth' : 'instant',
                block: 'nearest',
                inline: 'start',
            });
            scrollBehaviorSmooth = true;
        }
    });

    $: verseGoButtonDisabled = currentBook?.chapters?.flatMap((c) => c?.verseState).every((v) => !v?.selected);
    $: currentChapterSelected = currentChapter?.number && currentChapter?.number > 0;
    $: firstSelectedVerse = currentBook?.chapters?.flatMap((c) => c.verseState)?.find((v) => v.selected) || {
        chapterNumber: '',
        number: '',
    };
    $: lastSelectedVerse = currentBook?.chapters
        ?.flatMap((c) => c.verseState)
        ?.reverse()
        ?.find((v) => v.selected) || { chapterNumber: '', number: '' };
    $: verseTitle = formatBibleVerseRange(
        currentBook?.localizedName,
        firstSelectedVerse.chapterNumber,
        firstSelectedVerse.number,
        lastSelectedVerse.chapterNumber,
        lastSelectedVerse.number
    );
</script>

<div id="book-chapter-verse-selector-pane" class="overflow-hidden pb-24">
    <div class="flex h-full w-full flex-col items-center px-4">
        {#if currentStep !== steps.one}
            <button on:click={handleBack} class="mb-2 flex items-center self-start pe-8">
                <ChevronLeftIcon />
                <span class="ms-4">{currentStep.backText}</span>
            </button>
        {:else}
            <h3 class="my-2 font-bold">{currentStep.title}</h3>
        {/if}

        <hr class="my-2 w-screen" />
        <div
            class="flex h-[calc(100%-48px)] w-full flex-col items-center {currentStep === steps.one
                ? 'overflow-y-scroll'
                : ''}"
        >
            {#await availableBooksPromise}
                <p>{$translate('page.BookChapterSelectorPane.loading.value')}</p>
            {:then books}
                {#if books === null}
                    <p>{$translate('errorMessage.message.value')}</p>
                {:else}
                    {#if currentStep === steps.one}
                        <div class="h-full w-full">
                            {#each books as book}
                                {@const isCurrentBook = book === currentBook}
                                <button
                                    on:click={() => handleBookSelection(book)}
                                    class="my-2 flex w-full flex-wrap rounded-xl border p-4 {isCurrentBook
                                        ? 'border-2 border-[#3db6e7] bg-[#f0faff]'
                                        : 'border'}"
                                >
                                    {book.localizedName}
                                </button>
                            {/each}
                        </div>
                    {/if}
                    {#if currentStep === steps.two}
                        <h3 class="mb-4 self-start text-lg font-bold">{currentBook.localizedName}</h3>
                        <h4 class="mb-4 self-start">{currentStep.subtitle}</h4>
                        <div class="w-full flex-grow overflow-y-scroll">
                            <div class="grid w-full grid-cols-5 gap-4">
                                {#each currentBook.chapters as chapter}
                                    {@const isCurrentChapter = chapter === currentChapter}
                                    <button
                                        on:click={() => handleChapterSelection(chapter)}
                                        class="h-14 w-14 rounded-full {isCurrentChapter && 'bg-blue-500 text-white'}"
                                    >
                                        {chapter.number}
                                    </button>
                                {/each}
                            </div>
                        </div>
                        <hr class="my-4 w-screen" />
                        <button
                            on:click={handleGoToVerses}
                            disabled={!currentChapterSelected}
                            class="btn btn-primary w-full"
                            >{$translate('page.BookChapterSelectorPane.go.value')}
                            <Icon data={arrowRight} class="ms-2" />
                        </button>
                    {/if}
                    {#if currentStep === steps.three}
                        <h3 class="mb-2 self-start text-lg font-bold">{verseTitle}</h3>
                        <div class="flex w-full overflow-x-scroll py-4">
                            {#each currentBook.chapters as chapter, index}
                                {@const isCurrentChapter = chapter === currentChapter}
                                <button
                                    on:click={() => handleChapterSelection(chapter)}
                                    bind:this={buttons[index]}
                                    class="btn me-4 {isCurrentChapter && 'bg-blue-500 text-white'}"
                                >
                                    <span class="me-1">{currentBook.localizedName}</span><span>{chapter.number}</span>
                                </button>
                            {/each}
                        </div>
                        <h4 class="mb-4 self-start">{currentStep.subtitle}</h4>
                        <div class="w-full flex-grow overflow-y-scroll">
                            <div class="grid w-full grid-cols-5 gap-4">
                                {#if currentChapter && currentChapter.verseState}
                                    {#each currentChapter.verseState as verse}
                                        <button
                                            on:click={() => handleVerseSelection(verse)}
                                            class="h-14 w-14 rounded-full {verse.selected && 'bg-blue-500 text-white'}"
                                        >
                                            {verse.number}
                                        </button>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                        <hr class="my-4 w-screen" />

                        <button
                            on:click={handleVerseGoButton}
                            disabled={verseGoButtonDisabled}
                            class="btn btn-primary w-full"
                            >{$translate('page.BookChapterSelectorPane.go.value')}
                            <Icon data={arrowRight} class="ms-2" /></button
                        >
                    {/if}
                {/if}
            {/await}
        </div>
    </div>
</div>
