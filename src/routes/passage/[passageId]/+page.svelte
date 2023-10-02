<script lang="ts">
    import BookIcon from '$lib/icons/BookIcon.svelte';
    import type { PageData } from './$types';
    import AudioPlayer from '$lib/components/AudioPlayer.svelte';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import type { ImageContent, CbbtErTextContent, CbbtErAudioContent } from '$lib/types/file-manager';
    import type { FrontendChapterContent } from './+page';
    import type { CupertinoPane } from 'cupertino-pane';
    import { _ as translate } from 'svelte-i18n';
    import CompassIcon from '$lib/icons/CompassIcon.svelte';
    import DoubleChevronUpIcon from '$lib/icons/DoubleChevronUpIcon.svelte';
    import NavMenuTabItem from '$lib/components/NavMenuTabItem.svelte';
    import ResourcePane from './ResourcePane.svelte';
    import ButtonCarousel from '$lib/components/ButtonCarousel.svelte';
    import TopNavBar from '$lib/components/TopNavBar.svelte';
    import BibleUnavailable from './BibleUnavailable.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import {
        createMultiClipAudioState,
        type MultiClipAudioState,
        type AudioFileInfo,
    } from '$lib/components/AudioPlayer/audio-player-state';
    import { objectKeys } from '$lib/utils/typesafe-standard-lib';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    type Tab = 'bible' | 'guide';

    export let data: PageData;

    const steps = [
        $translate('resources.cbbt-er.step1.value'),
        $translate('resources.cbbt-er.step2.value'),
        $translate('resources.cbbt-er.step3.value'),
        $translate('resources.cbbt-er.step4.value'),
        $translate('resources.cbbt-er.step5.value'),
        $translate('resources.cbbt-er.step6.value'),
    ];

    let cbbterSelectedStepNumber = 1;
    let stepsAvailable: number[] = [];
    let cbbterText: CbbtErTextContent | undefined;
    let cbbterAudio: CbbtErAudioContent | undefined;
    let cbbterImages: ImageContent[] | undefined;
    let cbbterTitle: string | undefined;
    let bibleContent: { bookName?: string | undefined; chapters?: FrontendChapterContent[] } | undefined;
    let topOfStep: HTMLElement | null = null;
    let selectedTab: Tab = 'guide';
    let isShowingResourcePane = false;
    let resourcePane: CupertinoPane;
    let cbbterSelectedStepScroll: number | undefined;
    let currentTopNavBarTitle: string;
    let contentLoadedPromise: Promise<void> | undefined;
    let multiClipAudioStates: Record<string, MultiClipAudioState> = {};

    $: data.url && getContent(); // when the [passageId] changes, the data will change and trigger this
    $: selectedTab && cbbterSelectedStepNumber && handleNavBarTitleChange();
    $: cbbterSelectedStepNumber && topOfStep?.scrollIntoView();
    $: audioPlayerKey = selectedTab === 'bible' ? 'bible' : cbbterStepKey(cbbterSelectedStepNumber);
    $: audioPlayerShowing = !!multiClipAudioStates[audioPlayerKey];

    async function getContent() {
        contentLoadedPromise = (async () => {
            let [fetchedBibleContent, fetchedResourceContent] = await Promise.all([
                data.fetched.bibleContent,
                data.fetched.resourceContent,
            ]);
            cbbterTitle = fetchedResourceContent.title;
            cbbterText = fetchedResourceContent.text?.[0];
            cbbterAudio = fetchedResourceContent.audio?.[0];
            cbbterImages = fetchedResourceContent.images ?? [];
            bibleContent = fetchedBibleContent;
            stepsAvailable = Array.from(
                new Set([
                    ...(cbbterText?.steps?.map((step) => step?.stepNumber) ?? []),
                    ...(cbbterAudio?.steps?.map(({ step }) => step) ?? []),
                ])
            );
            clearBibleIdIfNotAvailable();
            populateAudioState();
            handleNavBarTitleChange();
        })();
    }

    function clearBibleIdIfNotAvailable() {
        if (!bibleContent?.chapters?.length && data.bibleId) {
            const newUrl = new URL($page.url);
            newUrl?.searchParams?.delete('bibleId');
            goto(newUrl);
        }
    }

    // Populate the audio state object with key/values like
    //   bible => MultiClipAudioState
    //   guideStep1 => MultiClipAudioState
    //   guideStep2 => MultiClipAudioState
    function populateAudioState() {
        const bibleAudioFiles = (bibleContent?.chapters?.map(({ audioData }) => audioData).filter(Boolean) || []).map(
            (data) => ({ url: data?.url, startTime: data?.startTimestamp || 0, endTime: data?.endTimestamp })
        ) as AudioFileInfo[];
        if (bibleAudioFiles.length) {
            multiClipAudioStates = { ...multiClipAudioStates, bible: createMultiClipAudioState(bibleAudioFiles) };
        }
        const cbbterAudioFiles = cbbterAudio?.steps.map((step) => {
            // return key/value mapping
            return [
                cbbterStepKey(step.step),
                createMultiClipAudioState([{ url: step[audioFileTypeForBrowser()].url, startTime: 0 }]),
            ];
        });
        if (cbbterAudioFiles?.length) {
            multiClipAudioStates = { ...multiClipAudioStates, ...Object.fromEntries(cbbterAudioFiles) };
        }
    }

    function cbbterStepKey(step: number) {
        return `guideStep${step}`;
    }

    function showOrDismissResourcePane(show: boolean) {
        if (show) {
            resourcePane?.present({ animate: true });
        } else {
            resourcePane?.destroy({ animate: true });
        }
    }

    function handleNavBarTitleChange() {
        if (selectedTab === 'bible') {
            if (cbbterText?.steps?.length && cbbterTitle) {
                currentTopNavBarTitle = cbbterTitle;
            } else {
                currentTopNavBarTitle = `${bibleContent?.bookName ?? ''} ${bibleContent?.chapters?.[0]?.number ?? ''}`;
            }
        } else if (cbbterTitle) {
            currentTopNavBarTitle = `${cbbterTitle} - ${steps[cbbterSelectedStepNumber - 1]}`;
        } else {
            currentTopNavBarTitle = '';
        }
    }

    $: showOrDismissResourcePane(isShowingResourcePane);
</script>

<ResourcePane bind:resourcePane bind:isShowing={isShowingResourcePane} images={cbbterImages} />

<div class="btm-nav border-t border-t-primary-300 z-40">
    <NavMenuTabItem bind:selectedTab tabName="bible" label={$translate('page.passage.nav.bible.value')}>
        <BookIcon />
    </NavMenuTabItem>
    <NavMenuTabItem bind:selectedTab tabName="guide" label={$translate('page.passage.nav.guide.value')}>
        <CompassIcon />
    </NavMenuTabItem>
    {#if cbbterImages?.length}
        <NavMenuTabItem
            bind:isSelected={isShowingResourcePane}
            flipWhenSelected={true}
            label={$translate('page.passage.nav.resources.value')}
        >
            <DoubleChevronUpIcon />
        </NavMenuTabItem>
    {/if}
</div>

<div id="passage-page" class="w-full h-full">
    <TopNavBar title={currentTopNavBarTitle} passage={data.passage} />
    {#await contentLoadedPromise}
        <FullPageSpinner />
    {:then}
        <div
            class="flex flex-col absolute left-0 right-0 top-0 {audioPlayerShowing
                ? 'bottom-[7.5rem]'
                : 'bottom-16'} z-10 pt-16"
        >
            <div class="flex flex-grow px-4 overflow-y-hidden {selectedTab !== 'bible' && 'hidden'}">
                {#if bibleContent?.chapters?.length}
                    <div class="prose mx-auto overflow-y-scroll">
                        {#each bibleContent.chapters as chapter}
                            {#each chapter.versesText as { number, text }}
                                <div class="py-1">
                                    <span class="sup pr-1">{number}</span><span>{@html text}</span>
                                </div>
                            {/each}
                        {/each}
                    </div>
                {:else}
                    <BibleUnavailable passage={data.passage} />
                {/if}
            </div>
            <div class="px-4 py-4 {selectedTab !== 'guide' && 'hidden'}">
                <div class="max-w-[65ch] m-auto">
                    <ButtonCarousel
                        bind:selectedValue={cbbterSelectedStepNumber}
                        bind:scroll={cbbterSelectedStepScroll}
                        buttons={stepsAvailable.map((stepNumber) => ({
                            value: stepNumber,
                            label: steps[stepNumber - 1],
                        }))}
                    />
                </div>
            </div>
            <div class="flex flex-grow px-4 overflow-y-hidden {selectedTab !== 'guide' && 'hidden'}">
                <div class="prose mx-auto flex flex-grow">
                    <span bind:this={topOfStep} />
                    <div class="flex flex-grow">
                        {#if stepsAvailable.length > 0}
                            {#each stepsAvailable as stepNumber}
                                {@const contentHTML = cbbterText?.steps?.find(
                                    (step) => step.stepNumber === stepNumber
                                )?.contentHTML}
                                <div
                                    class={cbbterSelectedStepNumber === stepNumber
                                        ? 'flex flex-col flex-grow'
                                        : 'hidden'}
                                >
                                    <div class="flex-grow overflow-y-scroll">
                                        {#if contentHTML}
                                            {@html contentHTML}
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        {:else}
                            {$translate('page.passage.noCbbterContent.value')}
                        {/if}
                    </div>
                </div>
            </div>
        </div>
        {#if objectKeys(multiClipAudioStates).length}
            <div
                class="flex justify-items-center z-10 px-4 bg-base-100 fixed bottom-16 max-w-[65ch] m-auto left-0 right-0 h-14 {!audioPlayerShowing &&
                    'hidden'}"
            >
                <AudioPlayer {multiClipAudioStates} currentClipKey={audioPlayerKey} />
            </div>
        {/if}
    {:catch}
        <ErrorMessage />
    {/await}
</div>
