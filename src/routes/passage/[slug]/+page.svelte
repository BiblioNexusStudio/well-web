<script lang="ts">
    import CbbterStepsNavigation from '$lib/components/CbbterStepsNavigation.svelte';
    import BookIcon from '$lib/icons/BookIcon.svelte';
    import type { PageData } from './$types';
    import AudioPlayer from '$lib/components/AudioPlayer.svelte';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import type { CbbtErImageContent, CbbtErTextContent, ResourceContentSteps } from '$lib/types/file-manager';
    import type { FrontendChapterContent } from './+page';
    import Icon from 'svelte-awesome';
    import chevronDown from 'svelte-awesome/icons/chevronDown';
    import { _ as translate } from 'svelte-i18n';
    import { asyncFilter } from '$lib/utils/async-array';
    import { cachedOrRealUrl, isCachedFromCdn } from '$lib/data-cache';

    export let data: PageData;

    let cbbterSelectedStepNumber = 1;
    let bibleViewSelected = false;
    let activePlayId: number | undefined = undefined;
    let stepsAvailable: number[] = [];
    let cbbterText: CbbtErTextContent | undefined;
    let cbbterAudio: ResourceContentSteps | undefined;
    let cbbterImages: CbbtErImageContent[] | undefined;
    let bibleContent: { bookName?: string | undefined; chapters?: FrontendChapterContent[] } | undefined;
    let topOfStep: HTMLElement | null = null;
    let isBibleTextExpanded = true;
    let isMediaExpanded = true;
    let fullscreenCbbterImage: CbbtErImageContent | null = null;

    $: cbbterSelectedStepNumber && topOfStep?.scrollIntoView();

    async function getContent() {
        let [fetchedBibleContent, fetchedResourceContent] = await Promise.all([
            data.fetched.bibleContent,
            data.fetched.resourceContent,
        ]);
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
    }
</script>

<svelte:window
    on:keydown={(key) => {
        if (key.key === 'Escape' && fullscreenCbbterImage !== null) {
            fullscreenCbbterImage = null;
        }
    }}
/>

<button
    on:click={() => (fullscreenCbbterImage = null)}
    class={`fixed inset-0 z-50 bg-black bg-opacity-50 ${fullscreenCbbterImage ? 'block' : 'hidden'}`}
>
    <div class="w-screen h-screen flex flex-col">
        <div
            aria-label={fullscreenCbbterImage?.displayName}
            style={`background-image: url('${
                fullscreenCbbterImage?.url ? cachedOrRealUrl(fullscreenCbbterImage.url) : ''
            }')`}
            class="flex-1 bg-center bg-no-repeat bg-contain"
        />
        <div class="flex-shrink-0 text-center text-xl py-4 bg-black">
            {fullscreenCbbterImage?.displayName}
        </div>
    </div>
</button>

<div class="navbar px-4 bg-base-200 fixed bottom-0 z-40 bg-transparent/90">
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
        {#if bibleContent?.chapters?.length}
            <button
                class="btn btn-square {bibleViewSelected ? 'btn-primary' : 'btn-ghost'} xl:hidden"
                on:click={() => (bibleViewSelected = !bibleViewSelected)}
            >
                <BookIcon />
            </button>
        {/if}
    </div>
</div>

<div class="flex flex-row justify-evenly h-full w-full pb-16 px-5">
    {#await getContent()}
        <FullPageSpinner />
    {:then}
        <div class="prose flex-grow {bibleViewSelected ? 'block' : 'hidden'} py-10 xl:block overflow-y-scroll">
            {#if bibleContent?.chapters?.length}
                {#each bibleContent.chapters as chapter}
                    <h3 class="my-2">{bibleContent.bookName} {chapter.number}</h3>
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
                    <div class="collapse">
                        <input class="min-h-0" type="checkbox" bind:checked={isBibleTextExpanded} />
                        <div class="collapse-title pb-2 min-h-0 p-0 text-lg font-medium">
                            <Icon
                                data={chevronDown}
                                class={`mb-1 transform transition-transform duration-300 ${
                                    isBibleTextExpanded ? '' : 'rotate-[-90deg]'
                                }`}
                            />
                            <span class="pl-1 text-lg text-base-content">{$translate('page.passage.text.value')}</span>
                        </div>
                        <div class="collapse-content p-0">
                            {#each chapter.versesText as { number, text }}
                                <div class="py-1">
                                    <span class="sup pr-1">{number}</span><span>{@html text}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            {/if}
            {#if cbbterImages?.length}
                <div class="collapse">
                    <input class="min-h-0" type="checkbox" bind:checked={isMediaExpanded} />
                    <div class="collapse-title pb-2 min-h-0 p-0 text-lg font-medium">
                        <Icon
                            data={chevronDown}
                            class={`mb-1 transform transition-transform duration-300 ${
                                isMediaExpanded ? '' : 'rotate-[-90deg]'
                            }`}
                        />
                        <span class="pl-1 text-lg text-base-content">{$translate('page.passage.media.value')}</span>
                    </div>
                    <div class="collapse-content p-0">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {#each cbbterImages as image}
                                <div class="p-4 flex flex-col items-center">
                                    <button on:click={() => (fullscreenCbbterImage = image)}>
                                        <img class="my-1" src={cachedOrRealUrl(image.url)} alt={image.displayName} />
                                    </button>
                                    <span class="text-center">{image.displayName}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
        <div class="divider divider-horizontal hidden xl:flex" />
        <div class="prose flex-grow {bibleViewSelected ? 'hidden' : 'block'} xl:block overflow-y-scroll">
            <span bind:this={topOfStep} />
            <div class="py-10">
                {#if stepsAvailable.length > 0}
                    {#each stepsAvailable as stepNumber}
                        {@const contentHTML = cbbterText?.steps?.find(
                            (step) => step.stepNumber === stepNumber
                        )?.contentHTML}
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
                            {#if contentHTML}
                                {@html contentHTML}
                            {/if}
                        </div>
                    {/each}
                {:else}
                    No CBBT-ER content available
                {/if}
            </div>
        </div>
    {/await}
</div>
