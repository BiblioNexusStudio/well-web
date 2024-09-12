<script lang="ts">
    import {
        createMultiClipAudioState,
        type MultiClipAudioState,
    } from '$lib/components/AudioPlayer/audio-player-state';
    import ButtonCarousel from '$lib/components/ButtonCarousel.svelte';
    import type { StepBasedGuideStep } from '$lib/types/resource';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import { afterUpdate } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { getContentContext } from '../context';
    import GlobeIcon from '$lib/icons/GlobeIcon.svelte';
    import { isShowingCommunityEditionModal } from '$lib/stores/community-edition-modal.store';

    export let steps: StepBasedGuideStep[];
    export let isShowing: boolean;
    export let multiClipAudioStates: Record<string, MultiClipAudioState> | undefined = undefined;
    export let audioPlayerKey: string | undefined;

    const { currentGuideStepIndex, setCurrentGuideStepIndex, setCurrentGuideItemInfo, clearCurrentGuideItemInfo } =
        getContentContext();

    let topOfSteps: HTMLElement[] = [];
    $: guideStepIndex = $currentGuideStepIndex ?? 0;
    let previousStepIndex = guideStepIndex;

    afterUpdate(() => {
        if (guideStepIndex !== previousStepIndex) {
            topOfSteps[guideStepIndex]?.scrollIntoView();
            previousStepIndex = guideStepIndex;
        }
    });

    $: isShowing
        ? setCurrentGuideItemInfo(steps[guideStepIndex]?.id, guideStepIndex, steps.length)
        : clearCurrentGuideItemInfo();
    $: isShowing && setAudioPlayerForStep(guideStepIndex);
    $: populateAudioState(steps);
    $: isShowing && $currentGuideStepIndex === null && setCurrentGuideStepIndex(0);

    // Populate the audio state object with key/values like
    //   guideStep1 => MultiClipAudioState
    //   guideStep2 => MultiClipAudioState
    function populateAudioState(steps: StepBasedGuideStep[]) {
        steps.forEach((step, stepIndex) => {
            if (step.audioUrl) {
                if (multiClipAudioStates) {
                    multiClipAudioStates[stepAudioKey(stepIndex)] = createMultiClipAudioState([
                        { url: step.audioUrl, type: audioFileTypeForBrowser(), startTime: 0 },
                    ]);
                }
            }
        });
    }

    function stepAudioKey(stepIndex: number) {
        return `guideStep${stepIndex}`;
    }

    function setAudioPlayerForStep(stepIndex: number) {
        audioPlayerKey = stepAudioKey(stepIndex);
    }

    function goToNextStep() {
        setCurrentGuideStepIndex(guideStepIndex + 1);
    }
</script>

{#if steps.length > 0}
    <div class="flex flex-col px-4 pb-2 {!isShowing && 'hidden'}">
        <progress
            class="progress progress-primary mx-auto mb-2 h-1 max-w-[65ch]"
            value={guideStepIndex + 1}
            max={steps.length}
        />
        <div>
            <div class="relative m-auto max-w-[65ch]">
                <ButtonCarousel
                    selectedValue={isShowing ? guideStepIndex : -1}
                    setSelectedValue={setCurrentGuideStepIndex}
                    buttons={steps.map((step, stepIndex) => ({
                        value: stepIndex,
                        label: step.label ?? '',
                    }))}
                    displayIcons={true}
                />
            </div>
        </div>
    </div>
{/if}
<div class="flex flex-grow overflow-y-hidden px-2 {!isShowing && 'hidden'}">
    <div class="prose mx-auto flex flex-grow">
        <div class="flex flex-grow">
            {#if steps.length > 0}
                {#each steps as step, stepIndex}
                    <div class={guideStepIndex === stepIndex ? 'flex flex-grow flex-col' : 'hidden'}>
                        <div class="flex-grow overflow-y-scroll">
                            <div bind:this={topOfSteps[stepIndex]} />
                            <div class="rounded-md {step.communityEdition && 'bg-warning-content'} mb-2 px-4 pb-2 pt-2">
                                {#if step.communityEdition}
                                    <div class="float-right p-4 pe-0 pt-2 text-warning">
                                        <button on:click={() => ($isShowingCommunityEditionModal = true)}>
                                            <GlobeIcon />
                                        </button>
                                    </div>
                                {/if}
                                <div class="[&>*:first-child]:mt-0">
                                    {#if step.contentHTML}
                                        {@html step.contentHTML}
                                    {/if}
                                </div>
                                {#if stepIndex < steps.length - 1}
                                    <div class="flex w-full flex-col items-center">
                                        <button
                                            on:click={goToNextStep}
                                            class="btn btn-primary my-2"
                                            data-app-insights-event-name="guide-content-next-button-clicked"
                                            >{$translate('page.passage.guide.next.value')}<span>→ </span></button
                                        >
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            {:else}
                {$translate('page.passage.noGuideContent.value')}
            {/if}
        </div>
    </div>
</div>
