<script lang="ts">
    import StarIcon from '$lib/icons/StarIcon.svelte';
    import StarFilledIcon from '$lib/icons/StarFilledIcon.svelte';

    export let rating: number;

    $: starHighlightPosition = rating - 1;

    const onClick = (newRating: number) => {
        rating = newRating;
    };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div class="flex text-primary">
    {#each { length: 5 } as _, i (i)}
        <button
            class="px-1"
            on:click={() => onClick(i + 1)}
            on:mouseover={() => (starHighlightPosition = i)}
            on:mouseleave={() => (starHighlightPosition = rating - 1)}
        >
            {#if starHighlightPosition >= i}
                <StarFilledIcon />
            {:else}
                <StarIcon />
            {/if}
        </button>
    {/each}
</div>
