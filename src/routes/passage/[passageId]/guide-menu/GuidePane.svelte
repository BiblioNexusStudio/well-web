<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { guideResources, setCurrentGuide, currentGuide } from '$lib/stores/parent-resource.store';
    import type { ApiParentResource } from '$lib/types/resource';
    import { closeAllPassagePageMenus, openBibleMenu } from '$lib/stores/passage-page.store';
    import { selectedId, selectedBookIndex } from '$lib/stores/passage-form.store';
    import { settings } from '$lib/stores/settings.store';
    import { SettingShortNameEnum, type Setting } from '$lib/types/settings';

    export let guidePane: CupertinoPane;
    export let isShowing: boolean;
    export let selectedTab: string | null = null;
    export let localizedGuides: ApiParentResource[] = $guideResources;

    function selectGuideAndHandleMenu(guideResource: ApiParentResource) {
        setCurrentGuide(guideResource);
        isShowing = false;
        closeAllPassagePageMenus();

        if ($selectedId === 'default' || $selectedBookIndex === 'default') {
            selectedTab = 'bible';
            openBibleMenu();
        } else {
            closeAllPassagePageMenus();
        }
    }

    function filterGuidesPerSettings(localizedGuides: ApiParentResource[], $settings: Setting[]) {
        const srvOnlySetting = $settings.find(
            (setting) => setting.shortName === SettingShortNameEnum.showOnlySrvResources
        );

        if (srvOnlySetting?.value === true) {
            return localizedGuides.filter((guide) => srvOnlySetting.parentResourceIds.includes(guide.id));
        }

        return localizedGuides;
    }

    onMount(() => {
        guidePane = new CupertinoPane('#guide-pane', {
            backdrop: true,
            topperOverflow: true,
            initialBreak: 'top',
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });
    });

    $: filteredGuides = filterGuidesPerSettings(localizedGuides, $settings);
</script>

<div id="guide-pane">
    <div class="flex w-full flex-col items-center">
        <h3 class="my-2 font-bold capitalize">{$translate('page.guideMenu.selectGuide.value')}</h3>
        <hr class="my-2 w-full" />
        {#each filteredGuides as guideResource}
            {@const isCurrentGuide = guideResource === $currentGuide}
            <button
                on:click={() => selectGuideAndHandleMenu(guideResource)}
                class="my-2 flex w-11/12 rounded-xl p-4 {isCurrentGuide
                    ? 'border-2 border-[#3db6e7] bg-[#f0faff]'
                    : 'border'}"
            >
                <span class="text-sm">{guideResource.displayName}</span>
                <span class="mx-1 text-sm">-</span>
                <span class="text-sm text-[#98A2B3]">{guideResource.shortName}</span>
            </button>
        {/each}
        {#if filteredGuides.length === 0}
            <h3 class="my-2 font-bold">{$translate('page.guideMenu.noGuides.value')}</h3>
        {/if}
    </div>
</div>
