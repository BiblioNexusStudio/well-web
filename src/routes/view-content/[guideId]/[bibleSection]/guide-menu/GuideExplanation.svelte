<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import MenuButton from '../MenuButton.svelte';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';

    export let back: () => void;
    export let showDrafting: () => void;
    export let showChecking: () => void;
</script>

<div class="flex w-full flex-row items-center">
    <div class="flex-1" />
    <div class="my-4 text-lg font-bold">{$translate('page.guideMenu.guideExplanationHeader.value')}</div>
    <div class="flex flex-1">
        <div class="flex-grow"></div>
        <button on:click={back} class="btn btn-link !btn-info"><XMarkIcon /></button>
    </div>
</div>

<div class="prose px-4 pb-4">
    {@html $translate('page.guideMenu.guideExplanationContent.value')}
</div>
<MenuButton onClick={showDrafting} data-app-insights-event-name="guide-menu-start-drafting">
    {$translate('page.guideMenu.draftingGuides.value')}
</MenuButton>
<MenuButton onClick={showChecking} data-app-insights-event-name="guide-menu-start-checking">
    {$translate('page.guideMenu.checkingGuides.value')}
</MenuButton>
