<script lang="ts">
    import { onMount } from 'svelte';

    export let buttons: { value: string | number; label: string }[];
    export let selectedValue: string | number;
    export let scroll: number | undefined;

    let carousel: HTMLElement | undefined;

    onMount(() => {
        if (scroll && carousel) {
            carousel.scrollTo({ left: scroll, behavior: 'instant' });
        }
    });
</script>

<div
    class="carousel space-x-2 text-base-500 bg-base-100 w-full"
    bind:this={carousel}
    on:scroll={() => (scroll = carousel?.scrollLeft)}
>
    {#each buttons as { value, label }}
        <div class="carousel-item">
            <button
                class={`text-sm font-semibold px-3 py-2 rounded-md ${
                    selectedValue === value && 'text-secondary-content bg-primary-50'
                }`}
                on:click={() => (selectedValue = value)}
            >
                {label}</button
            >
        </div>
    {/each}
</div>
