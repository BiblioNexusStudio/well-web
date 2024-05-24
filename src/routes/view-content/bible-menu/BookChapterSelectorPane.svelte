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
    import { isOnline } from '$lib/stores/is-online.store';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';

    export let bookChapterSelectorPane: CupertinoPane;
    export let isShowing: boolean;

    let currentBook: ApiBibleBook;
    let currentChapter: ApiBibleChapter | null = null;
    let buttons: HTMLButtonElement[] = [];
    let scrollBehaviorSmooth = false;
    let firstSelectedVerse: FrontEndVerseForSelectionPane | null = null;
    let lastSelectedVerse: FrontEndVerseForSelectionPane | null = null;

    $: availableBooksPromise = fetchAvailableBooks($currentLanguageInfo, $isOnline, $preferredBibleIds);

    async function fetchAvailableBooks(
        _currentLanguageInfo: Language | undefined,
        online: boolean,
        preferredBibleIds: number[]
    ) {
        return bibleChaptersByBookAvailable(online, preferredBibleIds);
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
            chapterNumber,
        }));
    }

    function handleVerseSelection(verse: FrontEndVerseForSelectionPane) {
        if (!firstSelectedVerse) {
            firstSelectedVerse = verse;
            return;
        }

        if (
            (!lastSelectedVerse && firstSelectedVerse.chapterNumber < verse.chapterNumber) ||
            (!lastSelectedVerse &&
                firstSelectedVerse.chapterNumber === verse.chapterNumber &&
                firstSelectedVerse.number < verse.number)
        ) {
            lastSelectedVerse = verse;
            return;
        }

        if (firstSelectedVerse && lastSelectedVerse) {
            firstSelectedVerse = null;
            lastSelectedVerse = null;
            return;
        }
    }

    function isVerseInSelectedRange(
        verse: FrontEndVerseForSelectionPane,
        firstSelectedVerse: FrontEndVerseForSelectionPane | null,
        lastSelectedVerse: FrontEndVerseForSelectionPane | null
    ) {
        if (firstSelectedVerse === verse || lastSelectedVerse === verse) {
            return true;
        }

        if (!firstSelectedVerse || !lastSelectedVerse) {
            return false;
        }

        if (firstSelectedVerse.chapterNumber === lastSelectedVerse.chapterNumber) {
            return (
                verse.chapterNumber === firstSelectedVerse.chapterNumber &&
                verse.number >= firstSelectedVerse.number &&
                verse.number <= lastSelectedVerse.number
            );
        }

        if (verse.chapterNumber === firstSelectedVerse.chapterNumber) {
            return verse.number >= firstSelectedVerse.number;
        }

        if (verse.chapterNumber === lastSelectedVerse.chapterNumber) {
            return verse.number <= lastSelectedVerse.number;
        }

        if (
            verse.chapterNumber > firstSelectedVerse.chapterNumber &&
            verse.chapterNumber < lastSelectedVerse.chapterNumber
        ) {
            return true;
        }

        return false;
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
            startChapter: firstSelectedVerse ? forceToInt(firstSelectedVerse.chapterNumber) : 0,
            startVerse: firstSelectedVerse ? forceToInt(firstSelectedVerse.number) : 0,
            endChapter: lastSelectedVerse
                ? forceToInt(lastSelectedVerse.chapterNumber)
                : firstSelectedVerse
                ? forceToInt(firstSelectedVerse.chapterNumber)
                : 0,
            endVerse: lastSelectedVerse
                ? forceToInt(lastSelectedVerse.number)
                : firstSelectedVerse
                ? forceToInt(firstSelectedVerse.number)
                : 0,
        };
        isShowing = false;
        currentStep = steps.one;
        currentChapter = null;
        firstSelectedVerse = null;
        lastSelectedVerse = null;
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
        } else if (startChapter && startVerse && !endChapter && !endVerse) {
            formattedRange = `${bookName} ${startChapter}:${startVerse}`;
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
            firstSelectedVerse = null;
            lastSelectedVerse = null;
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

    $: verseGoButtonDisabled = firstSelectedVerse === null;
    $: currentChapterSelected = currentChapter?.number && currentChapter?.number > 0;
    $: verseTitle = formatBibleVerseRange(
        currentBook?.localizedName,
        firstSelectedVerse?.chapterNumber || '',
        firstSelectedVerse?.number || '',
        lastSelectedVerse?.chapterNumber || '',
        lastSelectedVerse?.number || ''
    );
</script>

<div id="book-chapter-verse-selector-pane" class="overflow-hidden pb-24">
    <div class="flex h-full w-full flex-col items-center px-4">
        {#if currentStep !== steps.one}
            <button
                on:click={handleBack}
                class="mb-2 flex items-center self-start pe-8"
                data-app-insights-event-name="book-chapter-selector-pane-back-button-clicked"
            >
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
                                    data-app-insights-event-name={`book-chapter-selector-pane-${book?.code}-selected`}
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
                                        data-app-insights-event-name={`book-chapter-selector-pane-${currentBook.code}-chapter-${chapter.number}-selected`}
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
                            data-app-insights-event-name={`book-chapter-selector-pane-chapter-go-button-clicked`}
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
                                    data-app-insights-event-name={`book-chapter-selector-pane-${currentBook.code}-chapter-carousel-${chapter.number}-selected`}
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
                                        {@const isSelected = isVerseInSelectedRange(
                                            verse,
                                            firstSelectedVerse,
                                            lastSelectedVerse
                                        )}
                                        <button
                                            on:click={() => handleVerseSelection(verse)}
                                            class="h-14 w-14 rounded-full {isSelected && 'bg-blue-500 text-white'}"
                                            data-app-insights-event-name={`book-chapter-selector-pane-${currentBook.code}-chapter-${currentChapter.number}-verse-${verse.number}-selected`}
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
                            data-app-insights-event-name={`book-chapter-selector-pane-verse-go-button-clicked`}
                            >{$translate('page.BookChapterSelectorPane.go.value')}
                            <Icon data={arrowRight} class="ms-2" /></button
                        >
                    {/if}
                {/if}
            {/await}
        </div>
    </div>
</div>
