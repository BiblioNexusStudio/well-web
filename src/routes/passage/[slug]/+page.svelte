<script lang="ts">
    import BookIcon from '$lib/icons/BookIcon.svelte';
    import type { PageData } from './$types';
    import AudioPlayer from '$lib/components/AudioPlayer.svelte';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import type { CbbtErImageContent, CbbtErTextContent, ResourceContentSteps } from '$lib/types/file-manager';
    import type { FrontendChapterContent } from './+page';
    import type { CupertinoPane } from 'cupertino-pane';
    import { _ as translate } from 'svelte-i18n';
    import { asyncFilter } from '$lib/utils/async-array';
    import { isCachedFromCdn } from '$lib/data-cache';
    import CompassIcon from '$lib/icons/CompassIcon.svelte';
    import DoubleChevronUpIcon from '$lib/icons/DoubleChevronUpIcon.svelte';
    import NavMenuTabItem from '$lib/components/NavMenuTabItem.svelte';
    import ResourcePane from './ResourcePane.svelte';
    import ButtonCarousel from '$lib/components/ButtonCarousel.svelte';
    import TopNavBar from '$lib/components/TopNavBar.svelte';
    import { onMount } from 'svelte';

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
    let activePlayId: number | undefined = undefined;
    let stepsAvailable: number[] = [];
    let cbbterText: CbbtErTextContent | undefined;
    let cbbterAudio: ResourceContentSteps | undefined;
    let cbbterImages: CbbtErImageContent[] | undefined;
    let cbbterTitle: string | undefined;
    let bibleContent: { bookName?: string | undefined; chapters?: FrontendChapterContent[] } | undefined;
    let topOfStep: HTMLElement | null = null;
    let selectedTab: Tab = 'guide';
    let isShowingResourcePane = false;
    let resourcePane: CupertinoPane;
    let cbbterSelectedStepScroll: number | undefined;
    let currentTopNavBarTitle: string;
    let contentLoadedPromise: Promise<void> | undefined;
    let numberOfChapters: number | undefined;

    onMount(() => getContent());

    $: data && getContent(); // when the [slug] changes, the data will change and trigger this
    $: selectedTab && cbbterSelectedStepNumber && handleNavBarTitleChange();
    $: cbbterSelectedStepNumber && topOfStep?.scrollIntoView();

    async function getContent() {
        contentLoadedPromise = (async () => {
            let [fetchedBibleContent, fetchedResourceContent] = await Promise.all([
                data.fetched.bibleContent,
                data.fetched.resourceContent,
            ]);
            cbbterTitle = fetchedResourceContent.title;
            cbbterText = fetchedResourceContent.text?.[0];
            cbbterAudio = fetchedResourceContent.audio?.[0];
            cbbterImages = await asyncFilter(
                fetchedResourceContent.images ?? [],
                async (image) => await isCachedFromCdn(image.url)
            );
            bibleContent = fetchedBibleContent;
            stepsAvailable = Array.from(
                new Set([
                    ...(cbbterText?.steps.map((step) => step?.stepNumber) ?? []),
                    ...(cbbterAudio?.steps?.map(({ step }) => step) ?? []),
                ])
            );
            numberOfChapters = bibleContent.chapters?.length;
            handleNavBarTitleChange();
        })();
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
                currentTopNavBarTitle = `${bibleContent?.bookName ?? ''} ${bibleContent?.chapters?.[0].number ?? ''}`;
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

<div class={`btm-nav border-t border-t-primary-300 z-40`}>
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
    {#await contentLoadedPromise}
        <FullPageSpinner />
    {:then}
        <TopNavBar title={currentTopNavBarTitle} />
        <div class={`flex flex-col absolute inset-0 bottom-16 z-10 pt-12`}>
            {#if selectedTab === 'bible'}
                <div class="pt-5 px-4 {numberOfChapters === 1 ? 'h-full' : 'overflow-y-scroll'}">
                    <div class="prose mx-auto {numberOfChapters === 1 ? 'flex flex-col-reverse h-full' : ''}">
                        {#if bibleContent?.chapters?.length}
                            {#each bibleContent.chapters as chapter}
                                {#if chapter.audioData}
                                    <div class="py-4">
                                        <AudioPlayer
                                            bind:activePlayId
                                            audioFile={chapter.audioData.url}
                                            startTime={chapter.audioData.startTimestamp || 0}
                                            endTime={chapter.audioData.endTimestamp}
                                        />
                                    </div>
                                {/if}
                                <div class={numberOfChapters === 1 ? 'overflow-y-scroll grow' : ''}>
                                    {#each chapter.versesText as { number, text }}
                                        <div class="py-1">
                                            <span class="sup pr-1">{number}</span><span>{@html text}</span>
                                        </div>
                                    {/each}
                                </div>
                            {/each}
                        {:else}
                            {$translate('page.passage.noBibleContent.value')}
                        {/if}
                    </div>
                </div>
            {:else if selectedTab === 'guide'}
                <div class="px-4 py-6">
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
                <div class="flex flex-grow px-4 overflow-y-hidden">
                    <div class="prose mx-auto flex flex-grow">
                        <span bind:this={topOfStep} />
                        <div class="flex flex-grow">
                            {#if stepsAvailable.length > 0}
                                {#each stepsAvailable as stepNumber}
                                    {@const contentHTML = cbbterText?.steps?.find(
                                        (step) => step.stepNumber === stepNumber
                                    )?.contentHTML}
                                    {@const audioStep = cbbterAudio?.steps?.find((step) => step.step === stepNumber)}
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
                                        {#if audioStep}
                                            <div class="py-4">
                                                <AudioPlayer
                                                    audioFile={audioStep[audioFileTypeForBrowser()].url}
                                                    bind:activePlayId
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            {:else}
                                {$translate('page.passage.noCbbterContent.value')}
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {/await}
</div>
