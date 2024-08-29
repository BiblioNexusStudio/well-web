<script lang="ts">
    import type { ApiParentResource } from '$lib/types/resource';
    import { _ as translate } from 'svelte-i18n';
    import MenuButton from '../MenuButton.svelte';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';

    export let title: string;
    export let guides: ApiParentResource[];
    export let selectGuide: (guide: ApiParentResource) => Promise<void>;
    export let back: (() => void) | null;
</script>

<div class="flex w-full flex-row items-center">
    <div class="flex-1" />
    <div class="my-4 text-lg font-bold">{title}</div>
    <div class="flex flex-1">
        <div class="flex-grow"></div>
        {#if back}
            <button on:click={back} class="btn btn-link !btn-info"><XMarkIcon /></button>
        {/if}
    </div>
</div>

{#if !guides || guides.length === 0}
    <h3 class="my-2">
        {$translate('page.guideMenu.noGuides.value')}
    </h3>
{:else}
    {#each guides as guideResource}
        <MenuButton
            onClick={() => selectGuide(guideResource)}
            data-app-insights-event-name="guide-menu-resource-selected"
            data-app-insights-dimensions={`guideResource,${guideResource.displayName}`}
        >
            <span>{guideResource.displayName}</span>
            <span class="mx-1">-</span>
            <span class="text-[#98A2B3]">{guideResource.shortName}</span>
        </MenuButton>
    {/each}
{/if}
