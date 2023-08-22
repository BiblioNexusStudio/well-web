<script lang="ts">
    export let cbbterSelectedStepNumber = 1;
    export let bibleViewSelected = false;
    export let responsive: string;
    export let fullDisplay = false;
    export let buttonNames: number[] | string[] = [1, 2, 3, 4, 5, 6];

    function setCbbterStep(step: number) {
        cbbterSelectedStepNumber = step;
        bibleViewSelected = false;
    }
</script>

<div class="navbar-center join {responsive}">
    {#each buttonNames as buttonName, i}
        <button
            class="join-item btn"
            class:btn-primary={i === cbbterSelectedStepNumber - 1 && (!bibleViewSelected || fullDisplay)}
            on:click={() => setCbbterStep(i + 1)}>{buttonName}</button
        >
    {/each}
</div>
