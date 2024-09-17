<script lang="ts">
    import { onMount, tick } from 'svelte';
    import ChevronRightIcon from '$lib/icons/ChevronRightIcon.svelte';
    import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte';

    export let buttons: { value: number; label: string; eventTrackerName: string }[];
    export let buttonElements: (HTMLElement | null)[] = buttons.map(() => null);
    export let selectedValue: number | null;
    export let setSelectedValue: (value: number) => void;
    export let displayIcons = false;

    let carousel: HTMLElement | undefined;

    $: index = buttons.findIndex((button) => button.value === selectedValue);
    $: targetElement = buttonElements[index];
    $: scrollToButtonWithValue(selectedValue, false);

    function scrollToButtonWithValue(value: number | null, instant: boolean) {
        if (value === null) return;

        if (carousel && targetElement && displayIcons) {
            targetElement.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', inline: 'center' });
        } else if (carousel && targetElement) {
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

            carousel.scrollTo({ left: offset, behavior: instant ? 'instant' : 'smooth' });
        }
    }

    onMount(async () => {
        if (carousel) {
            // reset the scroll to prevent browsers from saving it
            carousel.scrollTo({ left: 0, behavior: 'instant' });
        }
        await tick(); // wait for targetElement to get bound
        scrollToButtonWithValue(selectedValue, true);
    });
</script>

<div class="carousel w-full space-x-2 bg-base-100 text-gray-400" bind:this={carousel}>
    {#if targetElement !== buttonElements[0] && displayIcons}
        <button
            class="radial-gradient-circle absolute left-0 flex h-full w-[36px] items-center justify-center bg-white"
            data-app-insights-event-name="button-carousel-left-arrow-clicked"
            on:click={() => {
                if (selectedValue !== null) {
                    setSelectedValue(selectedValue - 1);
                }
            }}><ChevronLeftIcon /></button
        >
    {/if}
    {#each buttons as { value, label, eventTrackerName }, index}
        <div class="carousel-item">
            <button
                class="rounded-md px-3 py-2 text-sm font-semibold {selectedValue === value &&
                    'bg-primary-50 text-base-500'}"
                on:click={() => setSelectedValue(value)}
                bind:this={buttonElements[index]}
                data-app-insights-event-name="button-carousel-clicked"
                data-app-insights-dimensions={`name,${eventTrackerName}`}
            >
                {label}</button
            >
        </div>
    {/each}
    {#if targetElement !== buttonElements[buttonElements.length - 1] && displayIcons}
        <button
            class="radial-gradient-circle absolute right-0 flex h-full w-[36px] items-center justify-center bg-white"
            data-app-insights-event-name="button-carousel-right-arrow-clicked"
            on:click={() => {
                if (selectedValue !== null) {
                    setSelectedValue(selectedValue + 1);
                }
            }}><ChevronRightIcon /></button
        >
    {/if}
</div>

<style>
    .radial-gradient-circle {
        background: radial-gradient(circle at center, rgba(255, 255, 255, 1) 55%, rgba(255, 255, 255, 0) 100%);
    }
</style>
