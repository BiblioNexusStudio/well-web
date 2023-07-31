<script lang="ts">
    import CbbterStepsNavigation from '$lib/components/CbbterStepsNavigation.svelte';
    import BookIcon from '$lib/icons/BookIcon.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    let cbbterSelectedIndex = 0;
    $: cbbter = data.cbbter[cbbterSelectedIndex];
    let bibleViewSelected = false;

    const stepNames: string[] = [
        'Hear and Heart',
        'Setting the Stage',
        'Defining the Scenes',
        'Embodying the Text',
        'Filling the Gaps',
        'Speaking the Word',
    ];
</script>

<div class="navbar px-4 bg-base-200 fixed bottom-0 z-50">
    <div class="navbar-start">
        <a href="/" class="font-bold normal-case text-xl">aquifer</a>
    </div>

    <CbbterStepsNavigation bind:cbbterSelectedIndex bind:bibleViewSelected responsive="xl:hidden" />
    <CbbterStepsNavigation
        bind:cbbterSelectedIndex
        bind:bibleViewSelected
        responsive="hidden xl:flex"
        fullDisplay={true}
        buttonNames={stepNames}
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
        {#each data.verses as verse}
            <h3>{data.book} / Chapter {verse.chapter}</h3>
            {#each verse.values as value, i}
                <div class="py-1">
                    <span class="sup pr-1">{i + verse.verseStart}</span><span>{@html value}</span>
                </div>
            {/each}
        {/each}
    </div>
    <div class="divider divider-horizontal hidden xl:flex" />
    <div class="prose flex-grow {bibleViewSelected ? 'hidden' : 'block'} xl:block">
        <h3>{stepNames[cbbterSelectedIndex]}</h3>
        {@html cbbter}
    </div>
</div>

<style>
</style>
