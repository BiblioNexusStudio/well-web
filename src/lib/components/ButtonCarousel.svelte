<script lang="ts">
    import { onMount } from 'svelte';

    export let buttons: { value: number; label: string }[];
    export let buttonElements: (HTMLElement | null)[] = buttons.map(() => null);
    export let selectedValue: number | null;
    export let scroll: number | undefined;

    let carousel: HTMLElement | undefined;

    $: scrollToButtonWithValue(selectedValue);

    function scrollToButtonWithValue(value: number | null) {
        if (value === null) return;

        const index = buttons.findIndex((button) => button.value === value);
        const targetElement = buttonElements[index];

        if (carousel && targetElement) {
            let offset;
            if (document.dir === 'ltr') {
                const nextElement = buttonElements[index + 1];

                if (nextElement) {
                    const nextOffset = nextElement.offsetLeft - carousel.offsetLeft;
                    offset = nextOffset + nextElement.offsetWidth - carousel.offsetWidth;
                } else {
                    offset = carousel.scrollWidth - carousel.offsetWidth;
                }
            } else {
                const prevElement = buttonElements[index - 1];
                if (prevElement) {
                    const prevOffset = prevElement.offsetLeft - carousel.offsetLeft;
                    offset = prevOffset + prevElement.offsetWidth - carousel.offsetWidth;
                } else {
                    offset = carousel.scrollWidth - carousel.offsetWidth;
                }
            }

            carousel.scrollTo({ left: offset, behavior: 'smooth' });
        }
    }

    onMount(() => {
        if (carousel) {
            // reset the scroll to prevent browsers from saving it
            carousel.scrollTo({ left: 0, behavior: 'instant' });
        }
        if (scroll && carousel) {
            carousel.scrollTo({ left: scroll, behavior: 'instant' });
        }
    });
</script>

<div
    class="carousel w-full space-x-2 bg-base-100 text-gray-400"
    bind:this={carousel}
    on:scroll={() => (scroll = carousel?.scrollLeft)}
>
    {#each buttons as { value, label }, index}
        <div class="carousel-item">
            <button
                class="rounded-md px-3 py-2 text-sm font-semibold {selectedValue === value &&
                    'bg-primary-50 text-base-500'}"
                on:click={() => (selectedValue = value)}
                bind:this={buttonElements[index]}
            >
                {label}</button
            >
        </div>
    {/each}
</div>
