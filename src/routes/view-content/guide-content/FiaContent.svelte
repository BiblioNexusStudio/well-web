<script lang="ts">
    import {
        createMultiClipAudioState,
        type MultiClipAudioState,
    } from '$lib/components/AudioPlayer/audio-player-state';
    import ButtonCarousel from '$lib/components/ButtonCarousel.svelte';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { fetchContentFromCacheOrNetwork } from '$lib/data-cache';
    import { log } from '$lib/logger';
    import { openGuideMenu } from '$lib/stores/passage-page.store';
    import {
        ParentResourceId,
        type ResourceContentInfo,
        MediaType,
        type ResourceContentTiptap,
    } from '$lib/types/resource';
    import { filterBoolean, filterBooleanByKey } from '$lib/utils/array';
    import { asyncMap } from '$lib/utils/async-array';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import {
        fetchMetadataForResourceContent,
        resourceContentApiFullUrl,
    } from '$lib/utils/data-handlers/resources/resource';
    import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-parsers';
    import { readFilesIntoObjectUrlsMapping } from '$lib/utils/unzip';
    import { _ as translate } from 'svelte-i18n';

    interface FiaAudioContent {
        steps: {
            stepNumber: number;
            url: string;
        }[];
    }

    interface FiaTextContent {
        steps: FiaTextSingleStepContent[];
    }

    interface ResourceContentFiaText extends ResourceContentTiptap {
        stepNumber: number;
    }

    interface FiaTextSingleStepContent extends ResourceContentFiaText {
        contentHTML: string;
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

    let topOfStep: HTMLElement | null = null;
    let selectedStepNumber = 1;
    let selectedStepScroll: number | undefined;
    let stepsAvailable: number[] = [];
    let textContent: FiaTextContent | undefined;
    let isLoading = false;

    $: selectedStepNumber && topOfStep?.scrollIntoView();
    $: fetchContent(guideResourceInfo);
    $: isShowing && setFiaAudioPlayerForStep(selectedStepNumber);
    $: openGuideMenuIfNoStepsAvailable(isShowing, isLoading);

    const steps = [
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
                textContent = (await fetchText(guideResourceInfo))[0];
                stepsAvailable = Array.from(
                    new Set([
                        ...(textContent?.steps?.map((step) => step.stepNumber) ?? []),
                        ...(audioContent?.steps?.map((step) => step.stepNumber) ?? []),
                    ])
                );
                selectedStepNumber = stepsAvailable[0] ?? 1;
                selectedStepScroll = stepsAvailable[0] ?? 1;
                if (audioContent) {
                    populateFiaAudioState(audioContent);
                }
            } else {
                textContent = undefined;
                stepsAvailable = [];
                selectedStepNumber = 1;
                selectedStepScroll = undefined;
            }
        } finally {
            isLoading = false;
        }
    }

    function openGuideMenuIfNoStepsAvailable(isShowing: boolean, isLoading: boolean) {
        if (isShowing && !isLoading && stepsAvailable.length === 0) {
            openGuideMenu();
        }
    }

    // Populate the audio state object with key/values like
    //   guideStep1 => MultiClipAudioState
    //   guideStep2 => MultiClipAudioState
    function populateFiaAudioState(audioContent: FiaAudioContent) {
        audioContent.steps.forEach((step) => {
            multiClipAudioStates[fiaAudioKey(step.stepNumber)] = createMultiClipAudioState([
                { url: step.url, type: audioFileTypeForBrowser(), startTime: 0 },
            ]);
        });
    }

    function fiaAudioKey(step: number) {
        return `fiaGuideStep${step}`;
    }

    function setFiaAudioPlayerForStep(step: number) {
        audioPlayerKey = fiaAudioKey(step);
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
        const allTextResourceContent = resourceContents.filter(
            ({ mediaType, parentResourceId }) =>
                parentResourceId === ParentResourceId.FIA && mediaType === MediaType.Text
        );
        return filterBoolean(
            await asyncMap(allTextResourceContent, async (resourceContent) => {
                try {
                    const content = (await fetchContentFromCacheOrNetwork(
                        resourceContentApiFullUrl(resourceContent)
                    )) as ResourceContentFiaText[];
                    return {
                        steps: content.map((step) => ({
                            ...step,
                            contentHTML: parseTiptapJsonToHtml(step.tiptap, undefined),
                        })),
                    };
                } catch (error) {
                    // stuff not cached
                    log.exception(error as Error);
                    return null;
                }
            })
        );
    }
</script>

{#if isLoading}
    <FullPageSpinner />
{:else}
    <div class="px-4 pb-4 {!isShowing && 'hidden'}">
        <div class="relative m-auto max-w-[65ch]">
            <ButtonCarousel
                bind:selectedValue={selectedStepNumber}
                bind:scroll={selectedStepScroll}
                buttons={stepsAvailable.map((stepNumber) => ({
                    value: stepNumber,
                    label: steps[stepNumber - 1] ?? '',
                }))}
                displayIcons={true}
            />
        </div>
    </div>
    <div class="flex flex-grow overflow-y-hidden px-4 {!isShowing && 'hidden'}">
        <div class="prose mx-auto flex flex-grow">
            <span bind:this={topOfStep} />
            <div class="flex flex-grow">
                {#if stepsAvailable.length > 0}
                    {#each stepsAvailable as stepNumber}
                        {@const contentHTML = textContent?.steps?.find(
                            (step) => step.stepNumber === stepNumber
                        )?.contentHTML}
                        <div class={selectedStepNumber === stepNumber ? 'flex flex-grow flex-col' : 'hidden'}>
                            <div class="flex-grow overflow-y-scroll">
                                {#if contentHTML}
                                    {@html contentHTML}
                                {/if}
                            </div>
                        </div>
                    {/each}
                {:else}
                    {$translate('page.passage.noFiaContent.value')}
                {/if}
            </div>
        </div>
    </div>
{/if}
