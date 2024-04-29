<script lang="ts">
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { getBibleBooksByBibleId, getBibleTextByParams } from '$lib/utils/data-handlers/resources/passages';
    import { bibleSetByUser } from '$lib/stores/bibles.store';
    import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte';

    export let bookChapterSelectorPane: CupertinoPane;
    export let isShowing: boolean;

    let currentBook: Book;
    let currentChapter: Chapter;

    type Chapter = {
        number: number;
        totalVerses: number;
        verseState: FrontEndVerse[];
    };

    type Book = {
        id: number;
        number: number;
        code: string;
        localizedName: string;
        totalChapters: number;
        chapters: Chapter[];
    };

    type FrontEndVerse = {
        number: number;
        selected: boolean;
        chapterNumber: number;
    };

    let promise = getBibleBooksByBibleId($bibleSetByUser?.id || 1);

    let steps = {
        one: { title: 'Available Books', subtitle: '', backText: '', backStep: '' },
        two: { title: 'Book', subtitle: 'Select Chapter', backText: 'Book', backStep: 'one' },
        three: { title: 'Chapter', subtitle: 'Select Verse', backText: 'Chapter', backStep: 'two' },
    };

    let currentStep = steps.one;

    function handleBookSelection(book: Book) {
        currentStep = steps.two;
        currentBook = book;
        currentBook.chapters.forEach((chapter) => {
            chapter.verseState = buildVerseSet(chapter.totalVerses, chapter.number);
        });
    }

    function handleChapterSelection(chapter: Chapter) {
        currentStep = steps.three;
        currentChapter = chapter;
    }

    function buildVerseSet(totalVerses: number, chapterNumber: number) {
        return Array.from({ length: totalVerses }, (_, index) => ({
            number: index + 1,
            selected: false,
            chapterNumber,
        }));
    }

    function handleVerseSelection(verse: FrontEndVerse) {
        const selectedVerses = currentBook.chapters
            .flatMap((c) => c.verseState.filter((v) => v.selected))
            .sort((a, b) => {
                if (a.chapterNumber === b.chapterNumber) {
                    return a.number - b.number;
                }
                return a.chapterNumber - b.chapterNumber;
            });

        console.log(selectedVerses);

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
            currentChapter = currentBook.chapters.find((c) => c.number === currentChapter.number)!;
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

            currentChapter = currentBook.chapters.find((c) => c.number === currentChapter.number)!;
        }
    }

    function handleBack() {
        if (currentStep === steps.two) {
            currentStep = steps.one;
        } else if (currentStep === steps.three) {
            currentStep = steps.two;
        }
    }

    async function handleVerseGoButton() {
        const firstSelectedVerse = currentBook.chapters.flatMap((c) => c.verseState).find((v) => v.selected)!;

        const lastSelectedVerse = currentBook.chapters
            .flatMap((c) => c.verseState)
            .reverse()
            .find((v) => v.selected)!;

        let params = [
            `booknumber=${currentChapter.number}`,
            `startchapter=${firstSelectedVerse.chapterNumber}`,
            `startverse=${firstSelectedVerse.number}`,
            `endchapter=${lastSelectedVerse.chapterNumber}`,
            `endverse=${lastSelectedVerse.number}`,
        ];

        let data = await getBibleTextByParams($bibleSetByUser?.id || 1, params);

        console.log(firstSelectedVerse, lastSelectedVerse, data);
    }

    onMount(async () => {
        bookChapterSelectorPane = new CupertinoPane('#book-chapter-verse-selector-pane', {
            backdrop: true,
            topperOverflow: true,
            initialBreak: 'top',
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });
    });

    $: verseGoButtonDisabled = currentBook?.chapters?.flatMap((c) => c?.verseState).every((v) => !v?.selected);
</script>

<div id="book-chapter-verse-selector-pane">
    <div class="flex w-full flex-col items-center px-4">
        {#if currentStep !== steps.one}
            <button on:click={handleBack} class="mb-2 flex items-center self-start pe-8">
                <ChevronLeftIcon />
                <span class="ms-4">{currentStep.backText}</span>
            </button>
        {:else}
            <h3 class="my-2 font-bold">{currentStep.title}</h3>
        {/if}

        <hr class="my-2 w-full" />
        <div class="flex w-full flex-col items-center overflow-y-scroll">
            {#await promise}
                <p>Loading...</p>
            {:then books}
                {#if currentStep === steps.one}
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
                {/if}
                {#if currentStep === steps.two}
                    <h3 class="mb-4 self-start text-lg font-bold">{currentBook.localizedName}</h3>
                    <h4 class="mb-4 self-start">{currentStep.subtitle}</h4>
                    <div class="grid w-full grid-cols-5 gap-4 overflow-y-auto">
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
                {/if}
                {#if currentStep === steps.three}
                    <h3 class="mb-4 self-start text-lg font-bold">{currentBook.localizedName}</h3>
                    <h4 class="mb-4 self-start">{currentStep.subtitle}</h4>
                    <div class="grid w-full grid-cols-5 gap-4 overflow-y-auto">
                        {#each currentChapter.verseState as verse}
                            <button
                                on:click={() => handleVerseSelection(verse)}
                                class="h-14 w-14 rounded-full {verse.selected && 'bg-blue-500 text-white'}"
                            >
                                {verse.number}
                            </button>
                        {/each}
                    </div>
                    <button
                        on:click={handleVerseGoButton}
                        disabled={verseGoButtonDisabled}
                        class="btn btn-primary self-end">Go</button
                    >
                {/if}
            {/await}
        </div>
    </div>
</div>
