<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;

    let cbbterSelectedIndex: number = 0;
    $: cbbter = data.cbbter[cbbterSelectedIndex];

    let stepNames: string[] = [
        'Hear and Heart',
        'Setting the Stage',
        'Defining the Scenes',
        'Embodying the Text',
        'Filling the Gaps',
        'Speaking the Word',
    ];
</script>

<div class="navbar px-4 bg-base-200 fixed bottom-0">
    <div class="navbar-start">
        <a href="/" class="font-bold normal-case text-xl">aquifer</a>
    </div>
    <div class="navbar-center join xl:hidden">
        {#each [1, 2, 3, 4, 5, 6] as buttonName}
            <button
                class="join-item btn {buttonName - 1 === cbbterSelectedIndex ? 'btn-primary' : ''}"
                on:click={() => (cbbterSelectedIndex = buttonName - 1)}>{buttonName}</button
            >
        {/each}
    </div>
    <div class="navbar-center join hidden xl:flex">
        {#each stepNames as buttonName, i}
            <button
                class="join-item btn {i === cbbterSelectedIndex ? 'btn-primary' : ''}"
                on:click={() => (cbbterSelectedIndex = i)}>{buttonName}</button
            >
        {/each}
    </div>
    <div class="navbar-end">
        <button class="btn btn-square btn-ghost">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="inline-block w-5 h-5 stroke-current"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                /></svg
            >
        </button>
    </div>
</div>

<div class="flex justify-evenly w-full">
    <div class="grid flex-grow card rounded-box prose">
        {@html cbbter}
    </div>
    <div class="divider divider-horizontal" />
    <div class="grid flex-grow card rounded-box prose">
        {@html cbbter}
    </div>
</div>

<!-- <div class="prose container mx-auto pt-8 pb-24"><p>{@html cbbter}</p></div> -->

<style>
</style>
