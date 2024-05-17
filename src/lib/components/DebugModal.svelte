<script lang="ts">
    import { clearEntireCache } from '$lib/data-cache';
    import { featureFlags } from '$lib/stores/feature-flags.store';
    import { objectKeys } from '$lib/utils/typesafe-standard-lib';
    import { onMount } from 'svelte';
    let show = window.location.hash === '#ff';
    let flagNames = objectKeys($featureFlags);

    function close() {
        window.location.hash = '';
        show = false;
    }

    function handleHashChange() {
        show = window.location.hash === '#ff';
    }

    const correctSequence = ['tl', 'tr', 'tr', 'bl'];
    let currentTapSequence: string[] = [];
    const boxSize = 0.2; // 20% of screen width/height

    function handleTap(e: TouchEvent) {
        const x = e.changedTouches[0]?.clientX ?? 0;
        const y = e.changedTouches[0]?.clientY ?? 0;
        const width = window.innerWidth;
        const height = window.innerHeight;

        const position =
            x < width * boxSize
                ? y < height * boxSize
                    ? 'tl'
                    : y > height * (1 - boxSize)
                    ? 'bl'
                    : ''
                : x > width * (1 - boxSize)
                ? y < height * boxSize
                    ? 'tr'
                    : y > height * (1 - boxSize)
                    ? 'br'
                    : ''
                : '';

        if (position) {
            currentTapSequence.push(position);
        }

        if (currentTapSequence.length > correctSequence.length) {
            currentTapSequence.shift();
        }

        if (currentTapSequence.join(',') === correctSequence.join(',')) {
            show = true;
            currentTapSequence = [];
        }
    }

    onMount(handleHashChange);
</script>

<svelte:window on:touchend={handleTap} on:hashchange={handleHashChange} />

<dialog class="modal" open={show}>
    <div class="modal-box">
        <div class="py-2">Feature Flags</div>
        {#each flagNames as flag}
            <div class="form-control">
                <label class="label cursor-pointer">
                    <span class="label-text">{flag}</span>
                    <input
                        type="checkbox"
                        bind:checked={$featureFlags[flag]}
                        class="checkbox"
                        data-app-insights-event-name={`debug-modal-${flag}-selected`}
                    />
                </label>
            </div>
        {/each}
        <div class="py-2">Clear All Cache Entries</div>
        <button class="btn" on:click={clearEntireCache}>Clear</button>
        <div class="modal-action">
            <button class="btn" on:click={close} data-app-insights-event-name="debug-modal-close-button-clicked"
                >Close</button
            >
        </div>
    </div>
</dialog>
