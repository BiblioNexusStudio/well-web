<script lang="ts">
    import { featureFlags, type FeatureFlag } from '$lib/stores/feature-flags.store';
    import { onMount } from 'svelte';
    let show = window.location.hash === '#ff';
    let flagNames = Object.keys($featureFlags) as FeatureFlag[];

    function close() {
        window.location.hash = '';
        show = false;
    }

    function handleHashChange() {
        show = window.location.hash === '#ff';
    }

    onMount(handleHashChange);
</script>

<svelte:window on:hashchange={handleHashChange} />

<dialog class="modal" open={show}>
    <div class="modal-box">
        {#each flagNames as flag}
            <div class="form-control">
                <label class="label cursor-pointer">
                    <span class="label-text">{flag}</span>
                    <input type="checkbox" bind:checked={$featureFlags[flag]} class="checkbox" />
                </label>
            </div>
        {/each}
        <div class="modal-action">
            <button class="btn" on:click={close}>Close</button>
        </div>
    </div>
</dialog>
