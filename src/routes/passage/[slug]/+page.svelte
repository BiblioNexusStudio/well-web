<script lang="ts">
    import CbbterStepsNavigation from '$lib/components/CbbterStepsNavigation.svelte';
    import BookIcon from '$lib/icons/BookIcon.svelte';
    import type { PageData } from './$types';
    import AudioPlayer from '$lib/components/AudioPlayer.svelte';
    import { isIOSSafari } from '$lib/utils/browser';

    export let data: PageData;

    let cbbterSelectedStepNumber = 1;
    let bibleViewSelected = false;
    let activePlayId: number | undefined = undefined;

    let cbbterText = data.textResourceContent[0];
    let cbbterAudio = data.audioResourceContent[0];

    let stepsAvailable = cbbterText.steps.map(({ stepNumber }) => stepNumber);
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

<div class="flex flex-row justify-evenly w-full pt-14 pb-20 px-5">
    <div class="prose flex-grow {bibleViewSelected ? 'block' : 'hidden'} xl:block">
        {#if data.chapters?.length}
            {#each data.chapters as chapter}
                <h3>{data.bookName} {chapter.number}</h3>
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
                {#each chapter.versesText as { number, text }}
                    <div class="py-1">
                        <span class="sup pr-1">{number}</span><span>{@html text}</span>
                    </div>
                {/each}
            {/each}
        {/if}
    </div>
    <div class="divider divider-horizontal hidden xl:flex" />
    <div class="prose flex-grow {bibleViewSelected ? 'hidden' : 'block'} xl:block">
        {#if cbbterText}
            {#each cbbterText.steps as { stepNumber, contentHTML }}
                {@const audioStep = cbbterAudio?.steps?.find((step) => step.step === stepNumber)}
                <div class={cbbterSelectedStepNumber === stepNumber ? '' : 'hidden'}>
                    {#if audioStep}
                        <div class="py-4">
                            <AudioPlayer audioFile={audioStep[isIOSSafari() ? 'mp3' : 'webm'].url} bind:activePlayId />
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

<style>
</style>
