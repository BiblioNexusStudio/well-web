<script lang="ts">
    import { onMount } from 'svelte';

    export let buttons: { value: number; label: string }[];
    export let buttonElements: (HTMLElement | null)[] = buttons.map(() => null);
    export let selectedValue: number;
    export let scroll: number | undefined;
    export let onChange: (value: number) => void;

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
    class="carousel space-x-2 text-base-500 bg-base-100 w-full"
    bind:this={carousel}
    on:scroll={() => (scroll = carousel?.scrollLeft)}
>
    {#each buttons as { value, label }, index}
        <div class="carousel-item">
            <button
                class={`text-sm font-semibold px-3 py-2 rounded-md ${
                    selectedValue === value && 'text-secondary-content bg-primary-50'
                }`}
                on:click={() => onChange(value)}
                bind:this={buttonElements[index]}
            >
                {label}</button
            >
        </div>
    {/each}
</div>
