<script lang="ts">
    import { trapFocus } from '$lib/utils/trap-focus';
    import { Icon } from 'svelte-awesome';
    import type { TextResource } from './types';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';

    export let resource: TextResource | null;
</script>

{#if resource !== null}
    <div use:trapFocus class="fixed inset-0 z-50 bg-primary-content w-full flex flex-col">
        <div class="flex flex-row pl-0 pr-4 py-3 items-center w-full max-w-[65ch] mx-auto">
            <button class="btn btn-link text-base-500" on:click={() => (resource = null)}
                ><Icon data={chevronLeft} /></button
            >
            <div class="text-lg font-semibold text-base-content pl-3">{resource.displayName}</div>
        </div>
        <div class="prose mx-auto overflow-y-scroll px-4 md:px-0 pb-4">
            {@html resource.html}
        </div>
    </div>
{/if}
