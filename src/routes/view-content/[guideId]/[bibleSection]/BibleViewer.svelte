<script lang="ts">
    import { currentLanguageInfo, lookupLanguageInfoById } from '$lib/stores/language.store';
    import { _ as translate } from 'svelte-i18n';
    import type { BibleData } from './data-fetchers';
    import BibleUnavailable from './BibleUnavailable.svelte';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { splitTextIntoWordsAndPunctuation, type WordOrPunctuation } from '$lib/utils/text-splitter';
    import { onMount } from 'svelte';
    import {
        fetchEnglishWordsWithGreekAlignmentsForSection,
        findSelectedWordIndexesAndGreekWordsForEnglish,
        formatAlignmentDefinition,
        type GreekWord,
    } from '$lib/utils/data-handlers/alignments';
    import { isNewTestament } from '$lib/utils/bible-section-helpers';
    import type { BibleSection } from '$lib/types/bible';
    import { getBibleBookCodesToName } from '$lib/utils/data-handlers/bible';
    import { getContentContext } from './context';
    import { log } from '$lib/logger';

    const { currentBibleSection } = getContentContext();

    export let bibleData: BibleData | null = null;
    export let preferredBiblesModalOpen: boolean;
    export let currentBibleId: number | null = null;
    export let alignmentModeEnabled: boolean;

    let selectedChapterIndex: number | null = null;
    let selectedVerseIndex: number | null = null;
    let selectedWordIndexes: number[] = [];
    let greekWordsForSelectedEnglish: GreekWord[] = [];
    let bookCodesToNames: Map<string, string> = new Map();
    let alignmentDataForChapters: Awaited<ReturnType<typeof fetchEnglishWordsWithGreekAlignmentsForSection>> | null =
        null;
    let isLoadingAlignmentData = false;

    $: splitTextForAlignment = alignmentModeEnabled
        ? currentBible?.content?.chapters?.map((chapter) =>
              chapter.versesText.map((verse) => splitTextIntoWordsAndPunctuation(verse.text))
          )
        : undefined;

    function getSplitTextForAlignment(chapterIndex: number, verseIndex: number) {
        return splitTextForAlignment?.[chapterIndex]?.[verseIndex];
    }

    $: currentBible = bibleData?.biblesForTabs.find((bible) => bible.id === currentBibleId);

    $: fetchAlignmentData($currentBibleSection, alignmentModeEnabled, alignmentDataForChapters);

    async function fetchAlignmentData(
        currentBibleSection: BibleSection | null,
        alignmentModeEnabled: boolean,
        currentAlignmentDataForChapters: typeof alignmentDataForChapters
    ) {
        if (
            currentBibleSection &&
            currentBibleId &&
            alignmentModeEnabled &&
            !currentAlignmentDataForChapters &&
            isNewTestament(currentBibleSection)
        ) {
            isLoadingAlignmentData = true;
            try {
                bookCodesToNames = await getBibleBookCodesToName($currentLanguageInfo?.id ?? 1);
                alignmentDataForChapters = await fetchEnglishWordsWithGreekAlignmentsForSection(
                    currentBibleId,
                    currentBibleSection
                );
            } finally {
                isLoadingAlignmentData = false;
            }
        }
    }

    function generateHtmlForVerseSplitText(
        splitText: WordOrPunctuation[],
        chapterIndex: number,
        chapterNumber: number,
        verseIndex: number,
        verseNumber: number,
        selectedWordIndexesForChapterVerse: number[]
    ) {
        return splitText
            .map(
                ({ text, spaceFollowing, isPunctuation }, wordIndex) =>
                    (isPunctuation
                        ? text
                        : `<span onclick="onBibleWordClicked(${chapterIndex}, ${chapterNumber}, ${verseIndex},
${verseNumber}, ${wordIndex})" class="cursor-pointer ${
                              selectedWordIndexesForChapterVerse.includes(wordIndex) && 'bg-primary-50'
                          }">${text}</span>`) + (spaceFollowing ? ' ' : '')
            )
            .join('');
    }

    onMount(() => {
        const onBibleWordClicked = (
            chapterIndex: number,
            chapterNumber: number,
            verseIndex: number,
            verseNumber: number,
            wordIndex: number
        ) => {
            selectedChapterIndex = null;
            selectedVerseIndex = null;
            selectedWordIndexes = [];
            greekWordsForSelectedEnglish = [];

            const verseData = alignmentDataForChapters?.get(chapterNumber)?.get(verseNumber);
            if (verseData) {
                const targetWord = splitTextForAlignment?.[chapterIndex]?.[verseIndex]?.[wordIndex]?.text?.replace(
                    /[’‘]/g,
                    "'"
                );
                log.trackEvent(
                    'bible-alignment-mode-word-clicked',
                    `word,${targetWord},book,${currentBible?.bookMetadata?.bookCode},chapter,${chapterNumber},verse,${verseNumber}`
                );
                const result = findSelectedWordIndexesAndGreekWordsForEnglish(wordIndex, targetWord, verseData);
                if (result) {
                    selectedChapterIndex = chapterIndex;
                    selectedVerseIndex = verseIndex;
                    selectedWordIndexes = result.selectedWordIndexes;
                    greekWordsForSelectedEnglish = result.greekWords;
                }
            }

            if (!selectedWordIndexes.length) {
                selectedChapterIndex = chapterIndex;
                selectedVerseIndex = verseIndex;
                selectedWordIndexes = [wordIndex];
            }

            setTimeout(() => {
                const spanId = `${chapterIndex}-${verseIndex}`;
                window.document.getElementById(spanId)?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
            }, 50);
        };
        window.onBibleWordClicked = onBibleWordClicked;
        return () => {
            if (window.onBibleWordClicked === onBibleWordClicked) {
                delete window.onBibleWordClicked;
            }
        };
    });

    function deselectWordOrDisableAlignmentMode() {
        if (selectedWordIndexes.length) {
            selectedChapterIndex = null;
            selectedVerseIndex = null;
            selectedWordIndexes = [];
            greekWordsForSelectedEnglish = [];
        } else {
            alignmentModeEnabled = false;
        }
    }
</script>

{#if currentBibleId === null}
    <BibleUnavailable bind:preferredBiblesModalOpen bibles={bibleData?.availableBibles} />
{:else if currentBible?.loadingContent || isLoadingAlignmentData}
    <FullPageSpinner />
{:else if currentBible}
    <div class="flex-start prose mx-auto w-full flex-1 overflow-y-scroll px-4">
        {#each currentBible?.content?.chapters || [] as chapter, chapterIndex}
            {#each chapter.versesText as { number, text }, verseIndex}
                {@const splitText = getSplitTextForAlignment(chapterIndex, verseIndex)}
                <div
                    id="{chapterIndex}-{verseIndex}"
                    class="py-1"
                    dir={lookupLanguageInfoById(currentBible.languageId)?.scriptDirection}
                >
                    <span class="sup pe-1">{number}</span>
                    {#if splitText && alignmentModeEnabled}
                        <!-- this conditional makes sure that if when we select a word we don't need to rerender every single verse but only the relevant one -->
                        {#if selectedChapterIndex === chapterIndex && selectedVerseIndex === verseIndex}
                            <span
                                >{@html generateHtmlForVerseSplitText(
                                    splitText,
                                    chapterIndex,
                                    chapter.number,
                                    verseIndex,
                                    number,
                                    selectedWordIndexes
                                )}</span
                            >
                        {:else}
                            <span
                                >{@html generateHtmlForVerseSplitText(
                                    splitText,
                                    chapterIndex,
                                    chapter.number,
                                    verseIndex,
                                    number,
                                    []
                                )}</span
                            >
                        {/if}
                    {:else}
                        {@html text}
                    {/if}
                </div>
            {/each}
        {:else}
            <span>{$translate('page.passage.noBibleContent.missingFromBible.value')}</span>
        {/each}
    </div>
    {#if alignmentModeEnabled}
        {#if greekWordsForSelectedEnglish.length}
            {@const firstWord = greekWordsForSelectedEnglish[0]}
            {#if firstWord}
                <div
                    class="relative flex h-1/3 flex-none flex-col items-center overflow-y-auto border-t border-black px-4 py-2"
                >
                    <button
                        class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
                        on:click={deselectWordOrDisableAlignmentMode}>✕</button
                    >
                    <div class="flex w-full flex-col items-start p-4">
                        <div class="w-full text-center font-bold">
                            {firstWord.word}
                        </div>
                        {#each firstWord.senses as { glosses, definition }, index}
                            <div class="mt-2">
                                <b>{$translate('page.passage.alignmentMode.gloss.value')}</b>
                                <ul class="ms-8 list-disc">
                                    {#each glosses as gloss}
                                        <li>{gloss}</li>
                                    {/each}
                                </ul>
                            </div>
                            <div class="mt-2">
                                <b>{$translate('page.passage.alignmentMode.definition.value')}</b>
                                <p class="ms-8">
                                    {formatAlignmentDefinition(definition, bookCodesToNames)}
                                </p>
                            </div>
                            {#if index !== firstWord.senses.length - 1}
                                <div class="divider mb-0 mt-2" />
                            {/if}
                        {:else}
                            <div class="w-full text-center mt-2">
                                {$translate('page.passage.alignmentMode.noSenseInfoAvailable.value')}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        {:else}
            <div class="relative flex flex-col items-center border-t border-black px-4 py-2">
                <button
                    class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
                    on:click={deselectWordOrDisableAlignmentMode}>✕</button
                >
                <div class="flex flex-row items-center p-4">
                    <div class="w-full text-center">
                        {#if selectedWordIndexes.length}
                            {$translate('page.passage.alignmentMode.noWordInfoAvailable.value')}
                        {:else}
                            {$translate('page.passage.alignmentMode.selectWord.value')}
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    {/if}
{:else}
    <div></div>
{/if}
