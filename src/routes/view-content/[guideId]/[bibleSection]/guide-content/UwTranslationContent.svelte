<script lang="ts">
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { isOnline } from '$lib/stores/is-online.store';
    import { ParentResourceId, MediaType, type StepBasedGuideStep, ReviewLevel } from '$lib/types/resource';
    import { filterBoolean } from '$lib/utils/array';
    import { asyncMap } from '$lib/utils/async-array';
    import {
        fetchTextResourceContentAndMetadataBatched,
        filterToAvailableAssociatedResourceContent,
        type ResourceContentInfoWithFrontendData,
    } from '$lib/utils/data-handlers/resources/resource';
    import { parseTiptapJsonToHtml } from '$lib/utils/tiptap';
    import { ContentTabEnum, getContentContext } from '../context';
    import { currentLanguageDirection } from '$lib/stores/language.store';
    import { handleRtlVerseReferences } from '$lib/utils/language-utils';
    import StepBasedContent from './StepBasedContent.svelte';
    import { _ as translate } from 'svelte-i18n';
    import type { BibleSection } from '$lib/types/bible';

    export let isShowing: boolean;
    export let guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined;
    export let audioPlayerKey: string | undefined;
    export let UwTranslationType:
        | ParentResourceId.UwTranslationNotes
        | ParentResourceId.UwTranslationQuestions
        | ParentResourceId.UwTranslationWords;
    export let bookCodesToNames: Map<string, string> | undefined;
    const { currentBibleSection } = getContentContext();

    type IsText<T> = T & {
        mediaType: MediaType.Text;
    };

    let isLoading = false;
    let steps: StepBasedGuideStep[] = [];

    $: fetchContent(guideResourceInfo, bookCodesToNames);
    $: isShowing && (audioPlayerKey = undefined);

    async function fetchContent(
        guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined,
        bookCodesToNames: Map<string, string> | undefined
    ) {
        try {
            if (guideResourceInfo) {
                isLoading = true;
                const uwTextResourceContent = guideResourceInfo.filter(
                    ({ mediaType, parentResourceId }) =>
                        parentResourceId === UwTranslationType && mediaType === MediaType.Text
                ) as IsText<ResourceContentInfoWithFrontendData>[];

                const fetchedContentAndMetadata =
                    await fetchTextResourceContentAndMetadataBatched(uwTextResourceContent);

                const unsortedSteps = filterBoolean(
                    await asyncMap(fetchedContentAndMetadata, async (contentAndMetadata) => {
                        const { content, metadata, ...restOfResourceInfo } = contentAndMetadata;
                        if (content) {
                            const availableAssociatedResources = await filterToAvailableAssociatedResourceContent(
                                $isOnline,
                                metadata?.associatedResources
                            );

                            const label = handleRtlVerseReferences(metadata?.displayName, $currentLanguageDirection);

                            const prefixedContent =
                                UwTranslationType === ParentResourceId.UwTranslationWords
                                    ? getUsedInVerses(restOfResourceInfo.verses, $currentBibleSection, bookCodesToNames)
                                    : `<b>${label}</b>`;

                            return {
                                ...restOfResourceInfo,
                                label: stripBookName(label) ?? '',
                                eventTrackerName: stripBookName(label) ?? '',
                                communityEdition: metadata?.reviewLevel === ReviewLevel.Community,
                                contentHTML:
                                    prefixedContent +
                                    parseTiptapJsonToHtml(
                                        content.tiptap,
                                        $currentLanguageDirection,
                                        ContentTabEnum.Guide,
                                        availableAssociatedResources
                                    ),
                            };
                        }
                    })
                );

                // sort by verse then by label
                steps = unsortedSteps.sort((a, b) => {
                    if (UwTranslationType !== ParentResourceId.UwTranslationWords) {
                        if (a.verses[0]!.chapter !== b.verses[0]!.chapter) {
                            return a.verses[0]!.chapter - b.verses[0]!.chapter;
                        }

                        if (a.verses[0]!.verse !== b.verses[0]!.verse) {
                            return a.verses[0]!.verse - b.verses[0]!.verse;
                        }
                    }

                    const aLabel = a.label ?? '';
                    const bLabel = b.label ?? '';

                    return aLabel.localeCompare(bLabel, undefined, { numeric: true });
                });
            } else {
                steps = [];
            }
        } finally {
            isLoading = false;
        }
    }

    function getUsedInVerses(
        verseInfo: ResourceContentInfoWithFrontendData['verses'],
        currentBibleSection: BibleSection | null,
        bookCodesToNames: Map<string, string> | undefined
    ) {
        var usedInVerses = `<b>${$translate('page.passage.guide.usedInVerses.value')}</b><div class="ml-4 mt-2 mb-4">`;
        if (currentBibleSection?.bookCode) {
            var bibleBook = bookCodesToNames?.get(currentBibleSection?.bookCode);
            var bibleReferences = '';
            verseInfo.forEach((ref, i) => {
                if (i === 0) {
                    bibleReferences += bibleBook + ' ';
                }
                bibleReferences += ref.chapter + ':' + ref.verse;
                if (i < verseInfo.length - 1) {
                    bibleReferences += ', ';
                }
            });
            usedInVerses += handleRtlVerseReferences(bibleReferences, $currentLanguageDirection) + '</div>';
        }

        return usedInVerses;
    }

    function stripBookName(input: string | undefined) {
        if (!input) {
            return input;
        }
        const parts = input.split(' ');
        const indexOfColon = parts.findIndex((part) => part.includes(':'));
        if (indexOfColon === -1) return input;
        return parts.slice(indexOfColon).join(' ');
    }
</script>

{#if isLoading}
    <FullPageSpinner {isShowing} />
{:else}
    <StepBasedContent {steps} {isShowing} bind:audioPlayerKey />
{/if}
