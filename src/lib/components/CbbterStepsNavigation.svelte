<script lang="ts">
    export let cbbterSelectedIndex = 0;
    export let bibleViewSelected = false;
    export let responsive: string;
    export let fullDisplay = false;
    export let buttonNames: number[] | string[] = [1, 2, 3, 4, 5, 6];

    function setCbbterStep(step: number) {
        cbbterSelectedIndex = step;
        bibleViewSelected = false;
    }
</script>

<div class="navbar-center join {responsive}">
    {#each buttonNames as buttonName, i}
        <button
            class="join-item btn"
            class:btn-primary={i === cbbterSelectedIndex && (!bibleViewSelected || fullDisplay)}
            on:click={() => setCbbterStep(i)}>{buttonName}</button
        >
    {/each}
</div>
