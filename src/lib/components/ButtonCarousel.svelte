<script lang="ts">
    import { onMount } from 'svelte';

    export let buttons: { value: number; label: string }[];
    export let buttonElements: (HTMLElement | null)[] = buttons.map(() => null);
    export let selectedValue: number;
    export let scroll: number | undefined;

    let carousel: HTMLElement | undefined;

    $: scrollToButtonWithValue(selectedValue);

    function scrollToButtonWithValue(value: number) {
        const index = buttons.findIndex((button) => button.value === value);
        const targetElement = buttonElements[index];

        if (carousel && targetElement) {
            const offset = targetElement.offsetLeft - carousel.offsetLeft;
            carousel.scrollTo({ left: offset, behavior: 'smooth' });
        }
    }

    onMount(() => {
        if (scroll && carousel) {
            carousel.scrollTo({ left: scroll, behavior: 'instant' });
        }
    });
</script>

<div
    class="carousel w-full space-x-2 bg-base-100 text-base-500"
    bind:this={carousel}
    on:scroll={() => (scroll = carousel?.scrollLeft)}
>
    {#each buttons as { value, label }, index}
        <div class="carousel-item">
            <button
                class="rounded-md px-3 py-2 text-sm font-semibold {selectedValue === value &&
                    'bg-primary-50 text-secondary-content'}"
                on:click={() => (selectedValue = value)}
                bind:this={buttonElements[index]}
            >
                {label}</button
            >
        </div>
    {/each}
</div>
