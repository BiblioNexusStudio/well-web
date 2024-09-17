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
    import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-parsers';
    import { ContentTabEnum } from '../context';
    import { currentLanguageDirection } from '$lib/stores/language.store';
    import { handleRtlVerseReferences } from '$lib/utils/language-utils';
    import StepBasedContent from './StepBasedContent.svelte';

    export let isShowing: boolean;
    export let guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined;
    export let audioPlayerKey: string | undefined;

    type IsText<T> = T & {
        mediaType: MediaType.Text;
    };

    let isLoading = false;
    let steps: StepBasedGuideStep[] = [];

    $: fetchContent(guideResourceInfo);
    $: isShowing && (audioPlayerKey = undefined);

    async function fetchContent(guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined) {
        try {
            if (guideResourceInfo) {
                isLoading = true;
                const uwTextResourceContent = guideResourceInfo.filter(
                    ({ mediaType, parentResourceId }) =>
                        parentResourceId === ParentResourceId.UwTranslationNotes && mediaType === MediaType.Text
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
                            return {
                                ...restOfResourceInfo,
                                label: stripBookName(label) ?? '',
                                eventTrackerName: stripBookName(label) ?? '',
                                communityEdition: metadata?.reviewLevel === ReviewLevel.Community,
                                contentHTML:
                                    `<b>${label}</b>` +
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
                    if (a.verses[0]!.chapter !== b.verses[0]!.chapter) {
                        return a.verses[0]!.chapter - b.verses[0]!.chapter;
                    }

                    if (a.verses[0]!.verse !== b.verses[0]!.verse) {
                        return a.verses[0]!.verse - b.verses[0]!.verse;
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
