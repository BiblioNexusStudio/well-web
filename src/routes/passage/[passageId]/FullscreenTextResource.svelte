<script lang="ts">
    import { trapFocus } from '$lib/utils/trap-focus';
    import { Icon } from 'svelte-awesome';
    import type { TextResource } from './types';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';

    export let resource: TextResource | null;
</script>

{#if resource !== null}
    <div use:trapFocus class="fixed inset-0 z-50 flex w-full flex-col bg-primary-content">
        <div class="mx-auto flex w-full max-w-[65ch] flex-row items-center py-3 pl-0 pr-4">
            <button class="btn btn-link text-base-500" on:click={() => (resource = null)}
                ><Icon data={chevronLeft} /></button
            >
            <div class="pl-3 text-lg font-semibold text-base-content">{resource.displayName}</div>
        </div>
        <div class="prose mx-auto overflow-y-scroll px-4 pb-4 md:px-0">
            {@html resource.html}
        </div>
    </div>
{/if}
