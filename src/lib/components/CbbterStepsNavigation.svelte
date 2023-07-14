<script lang="ts">
    export let cbbterSelectedIndex: number = 0;
    export let bibleViewSelected: boolean = false;
    export let responsive: string;
    export let fullDisplay: boolean = false;
    export let buttonNames: any[] = [1, 2, 3, 4, 5, 6];

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
