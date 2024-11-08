<script lang="ts">
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { _ as translate } from 'svelte-i18n';
    import { isOnline } from '$lib/stores/is-online.store';
    import {
        ParentResourceId,
        MediaType,
        type StepBasedGuideStep,
        ReviewLevel,
        type TiptapContent,
        type InnerTipTapContent,
    } from '$lib/types/resource';
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
    import {
        OpenTranslatorsNotesParagraphNote,
        OpenTranslatorsNotesSectionNote,
        OpenTranslatorsNotesTranslationOptions,
        OpenTranslatorsNotesTranslationOptionsDefaultOption,
    } from 'aquifer-tiptap';
    import { settings } from '$lib/stores/settings.store';
    import { SettingShortNameEnum } from '$lib/types/settings';
    import { filterStepsOnSettingChanges } from '$lib/utils/guide-content-helpers';

    export let isShowing: boolean;
    export let guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined;
    export let audioPlayerKey: string | undefined;

    type IsText<T> = T & {
        mediaType: MediaType.Text;
    };

    interface SilVerseStep extends StepBasedGuideStep {
        sectionNotes: TiptapContent | null;
        paragraphNotes: TiptapContent | null;
        alternateTranslations: TiptapContent | null;
    }

    let isLoading = false;
    let steps: SilVerseStep[] = [];

    const { pushToFullscreenTextResourceStack } = getContentContext();

    $: fetchContent(guideResourceInfo);
    $: isShowing && (audioPlayerKey = undefined);
    $: showAiResourcesSetting = !!$settings.find((s) => s.shortName === SettingShortNameEnum.showAiResources)?.value;
    $: showCommunityResourcesSetting = !!$settings.find(
        (s) => s.shortName === SettingShortNameEnum.showCommunityResources
    )?.value;
    $: filteredSteps = filterStepsOnSettingChanges(steps, showAiResourcesSetting, showCommunityResourcesSetting);

    async function fetchContent(guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined) {
        try {
            if (guideResourceInfo) {
                isLoading = true;
                const otnTextResourceContent = guideResourceInfo.filter(
                    ({ mediaType, parentResourceId }) =>
                        parentResourceId === ParentResourceId.SilOpenTranslatorsNotes && mediaType === MediaType.Text
                ) as IsText<ResourceContentInfoWithFrontendData>[];

                const fetchedContentAndMetadata =
                    await fetchTextResourceContentAndMetadataBatched(otnTextResourceContent);

                const unsortedSteps = filterBoolean(
                    await asyncMap(fetchedContentAndMetadata, async (contentAndMetadata) => {
                        const { content, metadata, ...restOfResourceInfo } = contentAndMetadata;
                        if (content) {
                            const availableAssociatedResources = await filterToAvailableAssociatedResourceContent(
                                $isOnline,
                                metadata?.associatedResources
                            );

                            const label = handleRtlVerseReferences(metadata?.displayName, $currentLanguageDirection);
                            const { tiptap, sectionNotes, paragraphNotes, alternateTranslations } =
                                calculateMainContentAndModalContent(content.tiptap);

                            return {
                                ...restOfResourceInfo,
                                label: stripBookName(label) ?? '',
                                eventTrackerName: stripBookName(label) ?? '',
                                communityEdition: metadata?.reviewLevel === ReviewLevel.Community,
                                aiEdition: metadata?.reviewLevel === ReviewLevel.Ai,
                                sectionNotes,
                                paragraphNotes,
                                alternateTranslations,
                                contentHTML: parseTiptapJsonToHtml(
                                    tiptap,
                                    $currentLanguageDirection,
                                    ContentTabEnum.Guide,
                                    availableAssociatedResources
                                ),
                            };
                        }
                    })
                );

                steps = unsortedSteps.sort((a, b) => {
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

    // This UX has both the main content as well as up to three buttons at the top that open fullscreen text content
    // for sections, paragraphs, and translation suggestions
    function calculateMainContentAndModalContent(tiptap: TiptapContent) {
        const filtered: InnerTipTapContent[] = [];
        const sectionNotes: TiptapContent = { type: 'doc', content: [] };
        const paragraphNotes: TiptapContent = { type: 'doc', content: [] };
        const alternateTranslations: TiptapContent = {
            type: 'doc',
            content: [
                {
                    type: 'heading',
                    attrs: {
                        level: 3,
                    },
                    content: [
                        {
                            type: 'text',
                            attrs: {},
                            text: $translate('resources.silOpenTranslatorsNotes.suggestionsButton.value'),
                        },
                    ],
                },
                {
                    type: 'paragraph',
                    attrs: {},
                    content: [
                        {
                            type: 'text',
                            attrs: {},
                            text: $translate('resources.silOpenTranslatorsNotes.suggestionsDescription.value'),
                        },
                    ],
                },
            ],
        };
        for (const node of tiptap.content) {
            switch (node.type) {
                case OpenTranslatorsNotesSectionNote.name:
                    sectionNotes.content.push(node);
                    break;
                case OpenTranslatorsNotesParagraphNote.name:
                    paragraphNotes.content.push(node);
                    break;
                case OpenTranslatorsNotesTranslationOptions.name: {
                    if ('verse' in node.attrs && node.attrs.verse)
                        alternateTranslations.content.push({
                            type: 'heading',
                            attrs: {
                                level: 4,
                            },
                            content: [
                                {
                                    type: 'text',
                                    attrs: {},
                                    text: node.attrs.verse.toString(),
                                },
                            ],
                        });
                    alternateTranslations.content.push(node);
                    const singleTranslation = JSON.parse(JSON.stringify(node)) as InnerTipTapContent;
                    singleTranslation.content = singleTranslation.content.filter(
                        (node) => node.type === OpenTranslatorsNotesTranslationOptionsDefaultOption.name
                    );
                    filtered.push(singleTranslation);
                    break;
                }
                default:
                    filtered.push(node);
            }
        }
        tiptap.content = filtered;
        return {
            tiptap,
            sectionNotes: sectionNotes.content.length === 0 ? null : sectionNotes,
            paragraphNotes: paragraphNotes.content.length === 0 ? null : paragraphNotes,
            alternateTranslations,
        };
    }

    function openTiptapInFullscreenTextView(id: number | null | undefined, tiptap: TiptapContent | null) {
        if (tiptap) {
            const html = parseTiptapJsonToHtml(tiptap, $currentLanguageDirection, ContentTabEnum.Guide, undefined);
            pushToFullscreenTextResourceStack(ContentTabEnum.Guide, {
                version: -1,
                id: id ?? -1,
                mediaType: MediaType.Text,
                html,
            });
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
    <StepBasedContent steps={filteredSteps} {isShowing} bind:audioPlayerKey>
        <div class="mx-auto mt-2 flex w-full max-w-[65ch] flex-row justify-evenly" slot="top-buttons" let:step>
            {#if step?.sectionNotes}
                <button
                    class="btn btn-outline btn-primary btn-sm border-2"
                    on:click={() => openTiptapInFullscreenTextView(step.id, step.sectionNotes)}
                    >{$translate('resources.silOpenTranslatorsNotes.sectionButton.value')}</button
                >
            {/if}
            {#if step?.paragraphNotes}
                <button
                    class="btn btn-outline btn-primary btn-sm border-2"
                    on:click={() => openTiptapInFullscreenTextView(step.id, step.paragraphNotes)}
                    >{$translate('resources.silOpenTranslatorsNotes.paragraphButton.value')}</button
                >
            {/if}
            {#if step?.alternateTranslations}
                <button
                    class="btn btn-outline btn-primary btn-sm border-2"
                    on:click={() => openTiptapInFullscreenTextView(step.id, step.alternateTranslations)}
                    >{$translate('resources.silOpenTranslatorsNotes.suggestionsButton.value')}</button
                >
            {/if}
        </div>
    </StepBasedContent>
{/if}
