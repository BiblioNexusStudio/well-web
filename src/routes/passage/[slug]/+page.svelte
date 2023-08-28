<script lang="ts">
    import CbbterStepsNavigation from '$lib/components/CbbterStepsNavigation.svelte';
    import BookIcon from '$lib/icons/BookIcon.svelte';
    import type { PageData } from './$types';
    import AudioPlayer from '$lib/components/AudioPlayer.svelte';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import type { CbbtErTextContent, ResourceContentSteps } from '$lib/types/file-manager';
    import type { FrontendChapterContent } from './+page';

    export let data: PageData;

    let cbbterSelectedStepNumber = 1;
    let bibleViewSelected = false;
    let activePlayId: number | undefined = undefined;
    let stepsAvailable: number[] = [];
    let cbbterText: CbbtErTextContent | undefined;
    let cbbterAudio: ResourceContentSteps | undefined;
    let bibleContent: { bookName?: string | undefined; chapters?: FrontendChapterContent[] };
    let topOfStep: HTMLElement | null = null;

    $: cbbterSelectedStepNumber && topOfStep?.scrollIntoView();

    async function getContent() {
        let [fetchedBibleContent, fetchedResourceContent] = await Promise.all([
            data.fetched.bibleContent,
            data.fetched.resourceContent,
        ]);
        cbbterText = fetchedResourceContent.text?.[0];
        cbbterAudio = fetchedResourceContent.audio?.[0];
        bibleContent = fetchedBibleContent;
        stepsAvailable = Array.from(
            new Set([
                ...(cbbterText?.steps.map((step) => step?.stepNumber) ?? []),
                ...(cbbterAudio?.steps?.map(({ step }) => step) ?? []),
            ])
        );
    }
</script>

<div class="navbar px-4 bg-base-200 fixed bottom-0 z-50 bg-transparent/90">
    <div class="navbar-start">
        <a href="/" class="font-bold normal-case text-xl">aquifer</a>
    </div>

    <CbbterStepsNavigation
        bind:cbbterSelectedStepNumber
        bind:bibleViewSelected
        responsive="xl:hidden"
        {stepsAvailable}
    />
    <CbbterStepsNavigation
        bind:cbbterSelectedStepNumber
        bind:bibleViewSelected
        responsive="hidden xl:flex"
        fullDisplay={true}
        {stepsAvailable}
    />

    <div class="navbar-end">
        <button
            class="btn btn-square {bibleViewSelected ? 'btn-primary' : 'btn-ghost'} xl:hidden"
            on:click={() => (bibleViewSelected = !bibleViewSelected)}
        >
            <BookIcon />
        </button>
    </div>
</div>

<div class="flex flex-row justify-evenly h-full w-full pb-16 px-5">
    {#await getContent()}
        <FullPageSpinner />
    {:then}
        <div class="prose flex-grow {bibleViewSelected ? 'block' : 'hidden'} py-10 xl:block overflow-y-scroll">
            {#if bibleContent.chapters?.length}
                {#each bibleContent.chapters as chapter}
                    {#if chapter.audioData}
                        <div class="py-4">
                            <AudioPlayer
                                bind:activePlayId
                                audioFile={chapter.audioData.url}
                                startTime={chapter.audioData.startTimestamp}
                                endTime={chapter.audioData.endTimestamp}
                            />
                        </div>
                    {/if}
                    <h3 class="my-2">{bibleContent.bookName} {chapter.number}</h3>
                    {#each chapter.versesText as { number, text }}
                        <div class="py-1">
                            <span class="sup pr-1">{number}</span><span>{@html text}</span>
                        </div>
                    {/each}
                {/each}
            {/if}
        </div>
        <div class="divider divider-horizontal hidden xl:flex" />
        <div class="prose flex-grow {bibleViewSelected ? 'hidden' : 'block'} xl:block overflow-y-scroll">
            <span bind:this={topOfStep} />
            <div class="py-10">
                {#if cbbterText}
                    {#each cbbterText.steps as { stepNumber, contentHTML }}
                        {@const audioStep = cbbterAudio?.steps?.find((step) => step.step === stepNumber)}
                        <div class={cbbterSelectedStepNumber === stepNumber ? '' : 'hidden'}>
                            {#if audioStep}
                                <div class="py-4">
                                    <AudioPlayer
                                        audioFile={audioStep[audioFileTypeForBrowser()].url}
                                        bind:activePlayId
                                    />
                                </div>
                            {/if}
                            {@html contentHTML}
                        </div>
                    {/each}
                {:else}
                    No CBBT-ER content available
                {/if}
            </div>
        </div>
    {/await}
</div>
