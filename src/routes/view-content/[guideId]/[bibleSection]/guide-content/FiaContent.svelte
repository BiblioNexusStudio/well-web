<script lang="ts">
    import type { MultiClipAudioState } from '$lib/components/AudioPlayer/audio-player-state';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { fetchContentFromCacheOrNetwork, isCachedAsContent } from '$lib/data-cache';
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
    import { asyncFilter, asyncMap } from '$lib/utils/async-array';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import {
        fetchMetadataForResourceContent,
        filterToAvailableAssociatedResourceContent,
        resourceContentApiFullUrl,
    } from '$lib/utils/data-handlers/resources/resource';
    import { parseTiptapJsonToHtml } from '$lib/utils/tiptap';
    import { readFilesIntoObjectUrlsMapping } from '$lib/utils/unzip';
    import { _ as translate } from 'svelte-i18n';
    import { ContentTabEnum, getContentContext } from '../context';
    import { currentLanguageDirection } from '$lib/stores/language.store';
    import { isOnline } from '$lib/stores/is-online.store';
    import StepBasedContent from './StepBasedContent.svelte';
    import FullscreenMediaResource from '../library-resource-menu/FullscreenMediaResource.svelte';
    import AmericanSignLanguageIcon from '$lib/icons/AmericanSignLanguageIcon.svelte';
    import { settings } from '$lib/stores/settings.store';
    import { SettingShortNameEnum } from '$lib/types/settings';
    import { filterStepsOnSettingChanges } from '$lib/utils/guide-content-helpers';

    interface ResourceContentFiaText extends ResourceContentTiptap {
        stepNumber?: number;
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

    interface VideoTypeMetadata {
        steps: {
            url: string;
            stepNumber: number;
        }[];
    }

    interface FiaStep extends StepBasedGuideStep {
        stepNumber: number;
    }

    export let isShowing: boolean;
    export let guideResourceInfo: ResourceContentInfo[] | undefined;
    export let multiClipAudioStates: Record<string, MultiClipAudioState>;
    export let audioPlayerKey: string | undefined;

    const { openContextualMenu } = getContentContext();

    let isLoading = false;
    let steps: FiaStep[] = [];
    let aslVideos: Awaited<ReturnType<typeof fetchAslVideoInfos>>;
    let aslVideoIndex: number | null = null;
    let filteredSteps: FiaStep[] = [];

    $: fetchContent(guideResourceInfo);
    $: openGuideMenuIfNoStepsAvailable(isShowing, isLoading);
    $: showAiResourcesSetting = !!$settings.find((s) => s.shortName === SettingShortNameEnum.showAiResources)?.value;
    $: showCommunityResourcesSetting = !!$settings.find(
        (s) => s.shortName === SettingShortNameEnum.showCommunityResources
    )?.value;
    $: filteredSteps = filterStepsOnSettingChanges(steps, showAiResourcesSetting, showCommunityResourcesSetting);

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
                const [audioInfos, textContent, aslVideoInfos] = await Promise.all([
                    await fetchAudio(guideResourceInfo),
                    await fetchText(guideResourceInfo),
                    await fetchAslVideoInfos(guideResourceInfo),
                ]);
                aslVideos = aslVideoInfos;
                let audioContent = audioInfos[0];
                steps = filterBoolean(
                    stepLabels.map((label, stepIndex) => {
                        let hasContent = false;
                        const stepNumber = stepIndex + 1;
                        const step: FiaStep = {
                            id: textContent?.id,
                            label,
                            eventTrackerName: `FIA Step ${stepNumber}`,
                            communityEdition: false,
                            aiEdition: false,
                            stepNumber,
                        };
                        if (audioContent) {
                            const stepAudio = audioContent.steps.find((s) => s.stepNumber === stepNumber);
                            if (stepAudio?.url) {
                                step.audioUrl = stepAudio.url;
                                hasContent = true;
                            }
                        }
                        if (textContent) {
                            // check for matching stepNumber but fall back to index if stepNumber is missing
                            const stepText = textContent.steps.find(
                                (s, i) =>
                                    s.stepNumber === stepNumber || (s.stepNumber === undefined && i + 1 === stepNumber)
                            );
                            if (stepText?.contentHTML) {
                                step.contentHTML = stepText.contentHTML;
                                hasContent = true;
                            }
                            step.communityEdition = !!stepText?.communityEdition;
                            step.aiEdition = !!stepText?.aiEdition;
                        }
                        return hasContent ? step : null;
                    })
                );
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

    async function fetchAslVideoInfos(resourceContents: ResourceContentInfo[]) {
        const aslVideoResourceInfo = resourceContents.find((r) => r.mediaType === MediaType.Video);
        if (aslVideoResourceInfo) {
            try {
                const online = $isOnline;
                const fullMetadata = await fetchMetadataForResourceContent(aslVideoResourceInfo);
                if (fullMetadata) {
                    const videoMetadata = fullMetadata.metadata as unknown as VideoTypeMetadata;
                    videoMetadata.steps = await asyncFilter(videoMetadata.steps, async (step) => {
                        return online || (await isCachedAsContent(step.url));
                    });
                    return videoMetadata.steps.map((s) => ({
                        url: s.url,
                        stepNumber: s.stepNumber,
                        ...aslVideoResourceInfo,
                        ...fullMetadata,
                    }));
                }
                return null;
            } catch (error) {
                // nothing cached
                log.exception(error as Error);
                return null;
            }
        }
        return null;
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
                        aiEdition: textMetadata?.reviewLevel === ReviewLevel.Ai,
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

    function openAslVideoFullscreen(step: FiaStep | undefined) {
        const index = (aslVideos ?? []).findIndex((v) => v.stepNumber === step?.stepNumber);
        if (index > -1) {
            aslVideoIndex = index;
        }
    }

    function aslVideoExistsForStep(step: FiaStep | undefined) {
        return step && aslVideos?.some((v) => v.stepNumber === step.stepNumber);
    }
</script>

<FullscreenMediaResource resources={aslVideos ?? []} bind:currentIndex={aslVideoIndex} />

{#if isLoading}
    <FullPageSpinner {isShowing} />
{:else}
    <StepBasedContent steps={filteredSteps} {isShowing} bind:multiClipAudioStates bind:audioPlayerKey>
        <button
            slot="inline-top-right"
            let:step
            class="btn btn-outline btn-primary btn-sm border-2 {!aslVideoExistsForStep(step) && 'hidden'}"
            on:click={() => openAslVideoFullscreen(step)}><AmericanSignLanguageIcon /></button
        >
    </StepBasedContent>
{/if}
