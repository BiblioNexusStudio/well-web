<script lang="ts">
    import type { MultiClipAudioState } from '$lib/components/AudioPlayer/audio-player-state';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { fetchContentFromCacheOrNetwork } from '$lib/data-cache';
    import { log } from '$lib/logger';
    import {
        ParentResourceId,
        type ResourceContentInfo,
        MediaType,
        type ResourceContentTiptap,
        type ResourceContentMetadata,
        type StepBasedGuideStep,
        ReviewLevel,
    } from '$lib/types/resource';
    import { filterBoolean, filterBooleanByKey } from '$lib/utils/array';
    import { asyncMap } from '$lib/utils/async-array';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import {
        fetchMetadataForResourceContent,
        filterToAvailableAssociatedResourceContent,
        resourceContentApiFullUrl,
    } from '$lib/utils/data-handlers/resources/resource';
    import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-parsers';
    import { readFilesIntoObjectUrlsMapping } from '$lib/utils/unzip';
    import { _ as translate } from 'svelte-i18n';
    import { ContentTabEnum, getContentContext } from '../context';
    import { currentLanguageDirection } from '$lib/stores/language.store';
    import { isOnline } from '$lib/stores/is-online.store';
    import StepBasedContent from './StepBasedContent.svelte';

    interface ResourceContentFiaText extends ResourceContentTiptap {
        stepNumber: number;
    }

    interface FiaAudioMetadata {
        webm: AudioTypeMetadata;
        mp3: AudioTypeMetadata;
    }

    interface AudioTypeMetadata {
        steps: {
            file: string;
            stepNumber: number;
        }[];
    }

    export let isShowing: boolean;
    export let guideResourceInfo: ResourceContentInfo[] | undefined;
    export let multiClipAudioStates: Record<string, MultiClipAudioState>;
    export let audioPlayerKey: string | undefined;

    const { openContextualMenu } = getContentContext();

    let isLoading = false;
    let steps: StepBasedGuideStep[] = [];

    $: fetchContent(guideResourceInfo);
    $: openGuideMenuIfNoStepsAvailable(isShowing, isLoading);

    const stepLabels = [
        $translate('resources.fia.step1.value'),
        $translate('resources.fia.step2.value'),
        $translate('resources.fia.step3.value'),
        $translate('resources.fia.step4.value'),
        $translate('resources.fia.step5.value'),
        $translate('resources.fia.step6.value'),
    ];

    async function fetchContent(guideResourceInfo: ResourceContentInfo[] | undefined) {
        try {
            if (guideResourceInfo) {
                isLoading = true;
                let audioContent = (await fetchAudio(guideResourceInfo))[0];
                const textContent = await fetchText(guideResourceInfo);
                steps = stepLabels.map((label, stepIndex) => {
                    const stepNumber = stepIndex + 1;
                    const step: StepBasedGuideStep = { id: textContent?.id, label, communityEdition: false };
                    if (audioContent) {
                        const stepAudio = audioContent.steps.find((s) => s.stepNumber === stepNumber);
                        if (stepAudio?.url) {
                            step.audioUrl = stepAudio.url;
                        }
                    }
                    if (textContent) {
                        const stepText = textContent.steps.find((s) => s.stepNumber === stepNumber);
                        if (stepText?.contentHTML) {
                            step.contentHTML = stepText.contentHTML;
                        }
                        step.communityEdition = !!stepText?.communityEdition;
                    }
                    return step;
                });
            } else {
                steps = [];
            }
        } finally {
            isLoading = false;
        }
    }

    function openGuideMenuIfNoStepsAvailable(isShowing: boolean, isLoading: boolean) {
        if (isShowing && !isLoading && steps.length === 0) {
            openContextualMenu();
        }
    }

    async function fetchAudio(resourceContents: ResourceContentInfo[]) {
        const allAudioResourceContent = resourceContents.filter(
            ({ mediaType, parentResourceId }) =>
                parentResourceId === ParentResourceId.FIA && mediaType === MediaType.Audio
        );
        return filterBoolean(
            await asyncMap(allAudioResourceContent, async (resourceContent) => {
                try {
                    const metadata = await fetchMetadataForResourceContent(resourceContent);
                    const audioTypeSteps = ((metadata?.metadata || null) as FiaAudioMetadata | null)?.[
                        audioFileTypeForBrowser()
                    ].steps;
                    if (!audioTypeSteps) return null;
                    const steps = filterBooleanByKey(
                        await readFilesIntoObjectUrlsMapping(
                            resourceContentApiFullUrl(resourceContent),
                            audioTypeSteps
                        ),
                        'url'
                    );
                    return { steps };
                } catch (error) {
                    // nothing cached
                    log.exception(error as Error);
                    return null;
                }
            })
        );
    }

    async function fetchText(resourceContents: ResourceContentInfo[]) {
        const textResourceContent = resourceContents.find(
            ({ mediaType, parentResourceId }) =>
                parentResourceId === ParentResourceId.FIA && mediaType === MediaType.Text
        );
        if (textResourceContent) {
            let textMetadata: ResourceContentMetadata | null = null;
            try {
                textMetadata = await fetchMetadataForResourceContent(textResourceContent);
            } catch (error) {
                // stuff not cached
                log.exception(error as Error);
            }
            try {
                const content = (await fetchContentFromCacheOrNetwork(
                    resourceContentApiFullUrl(textResourceContent)
                )) as ResourceContentFiaText[];
                const availableAssociatedResources = await filterToAvailableAssociatedResourceContent(
                    $isOnline,
                    textMetadata?.associatedResources
                );
                return {
                    id: textResourceContent.id,
                    steps: content.map((step) => ({
                        ...step,
                        communityEdition: textMetadata?.reviewLevel === ReviewLevel.Community,
                        contentHTML: parseTiptapJsonToHtml(
                            step.tiptap,
                            $currentLanguageDirection,
                            ContentTabEnum.Guide,
                            availableAssociatedResources
                        ),
                    })),
                };
            } catch (error) {
                // stuff not cached
                log.exception(error as Error);
                return null;
            }
        }
        return null;
    }
</script>

{#if isLoading}
    <FullPageSpinner {isShowing} />
{:else}
    <StepBasedContent {steps} {isShowing} bind:multiClipAudioStates bind:audioPlayerKey />
{/if}
