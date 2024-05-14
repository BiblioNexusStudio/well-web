<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { settings } from '$lib/stores/settings.store';
    import { SettingShortNameEnum, type Setting } from '$lib/types/settings';
    import { guideResources, setCurrentGuide, currentGuide } from '$lib/stores/parent-resource.store';
    import type { ApiParentResource, ParentResourceName } from '$lib/types/resource';

    export let localizedGuides: ApiParentResource[] = $guideResources;
    export let showBookPassageSelectorPane: boolean;

    $: filteredGuides = filterGuidesPerSettings(localizedGuides, $settings);

    function selectGuideAndHandleMenu(guideResource: ApiParentResource) {
        setCurrentGuide(guideResource);
    }

    function filterGuidesPerSettings(localizedGuides: ApiParentResource[], $settings: Setting[]) {
        const srvOnlySetting = $settings.find(
            (setting) => setting.shortName === SettingShortNameEnum.showOnlySrvResources
        );

        if (srvOnlySetting?.value === true) {
            return localizedGuides.filter((guide) =>
                srvOnlySetting.parentResources.includes(guide.shortName as ParentResourceName)
            );
        }

        return localizedGuides;
    }

    function openGuideMenu() {
        showBookPassageSelectorPane = true;
    }
</script>

<div class="z-50 flex h-full w-full flex-col">
    <div class="relative mb-6 flex h-[166px] w-full rounded-b-3xl bg-[#EAAA08] pl-6 pt-12">
        <div class="absolute bottom-0 left-0 w-full">
            <img src="/menu-swish.png" alt="Menu Swish" class="h-auto w-full rounded-b-3xl" />
        </div>
        <div class="flex flex-col">
            <h2 class="z-10 mb-2 text-2xl font-bold text-white">
                {$translate('page.guideMenu.translationGuides.value')}
            </h2>
            <span class="z-10 text-sm text-white">{$translate('page.guideMenu.chooseGuide.value')}</span>
        </div>
    </div>
    <div class="flex w-full flex-col items-center overflow-y-auto">
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
            <h3 class="my-2">
                {$translate('page.guideMenu.noGuides.value')}
            </h3>
        {/if}
    </div>
    <div class="mb-24 flex flex-grow items-end px-4">
        <button on:click={openGuideMenu} class="btn btn-primary w-full"
            >{$translate('page.guideMenu.selectGuide.value')}</button
        >
    </div>
</div>
