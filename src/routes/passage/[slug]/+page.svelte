<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;

    let cbbterSelectedIndex: number = 0;
    $: cbbter = data.cbbter[cbbterSelectedIndex];
    let bibleViewSelected: boolean = false;

    const stepNames: string[] = [
        'Hear and Heart',
        'Setting the Stage',
        'Defining the Scenes',
        'Embodying the Text',
        'Filling the Gaps',
        'Speaking the Word',
    ];

    function setCbbterStep(step: number) {
        cbbterSelectedIndex = step;
        bibleViewSelected = false;
    }
</script>

<div class="navbar px-4 bg-base-200 fixed bottom-0 z-50">
    <div class="navbar-start">
        <a href="/" class="font-bold normal-case text-xl">aquifer</a>
    </div>
    <div class="navbar-center join xl:hidden">
        {#each [1, 2, 3, 4, 5, 6] as buttonName, i}
            <button
                class="join-item btn {buttonName - 1 === cbbterSelectedIndex && !bibleViewSelected
                    ? 'btn-primary'
                    : null}"
                on:click={() => setCbbterStep(i)}>{buttonName}</button
            >
        {/each}
    </div>
    <div class="navbar-center join hidden xl:flex">
        {#each stepNames as buttonName, i}
            <button
                class="join-item btn {i === cbbterSelectedIndex ? 'btn-primary' : null}"
                on:click={() => setCbbterStep(i)}>{buttonName}</button
            >
        {/each}
    </div>
    <div class="navbar-end">
        <button
            class="btn btn-square {bibleViewSelected ? 'btn-primary' : 'btn-ghost'} xl:hidden"
            on:click={() => (bibleViewSelected = !bibleViewSelected)}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
            </svg>
        </button>
    </div>
</div>

<div class="flex flex-row justify-evenly w-full pt-14 pb-20">
    <div class="prose flex-grow {bibleViewSelected ? 'block' : 'hidden'} xl:block">
        {#each data.verses as verse, i}
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

<!-- <div class="prose container mx-auto pt-8 pb-24"><p>{@html cbbter}</p></div> -->

<style>
</style>
