<script lang="ts">
    import { _ as translate } from 'svelte-i18n';

    export let cbbterSelectedStepNumber = 1;
    export let bibleViewSelected = false;
    export let responsive: string;
    export let fullDisplay = false;
    export let stepsAvailable: number[];

    const steps = [
        $translate('resources.cbbt-er.step1.value'),
        $translate('resources.cbbt-er.step2.value'),
        $translate('resources.cbbt-er.step3.value'),
        $translate('resources.cbbt-er.step4.value'),
        $translate('resources.cbbt-er.step5.value'),
        $translate('resources.cbbt-er.step6.value'),
    ];

    function setCbbterStep(step: number) {
        cbbterSelectedStepNumber = step;
        bibleViewSelected = false;
    }
</script>

<div class="navbar-center join {responsive}">
    {#each stepsAvailable as stepNumber}
        <button
            class="join-item btn"
            class:btn-primary={stepNumber === cbbterSelectedStepNumber && (!bibleViewSelected || fullDisplay)}
            on:click={() => setCbbterStep(stepNumber)}>{fullDisplay ? steps[stepNumber - 1] : stepNumber}</button
        >
    {/each}
</div>
