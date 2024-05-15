<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { settings } from '$lib/stores/settings.store';
    import { SettingShortNameEnum, type Setting } from '$lib/types/settings';
    import { setCurrentGuide, currentGuide } from '$lib/stores/parent-resource.store';
    import type { ApiParentResource, ParentResourceName } from '$lib/types/resource';
    import {
        guidesAvailableForBibleSection,
        guidesAvailableInCurrentLanguage,
    } from '$lib/utils/data-handlers/resources/guides';
    import { selectedBibleSection } from '$lib/stores/passage-form.store';
    import type { Language } from '$lib/types/file-manager';
    import type { BibleSection } from '$lib/types/bible';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { isOnline } from '$lib/stores/is-online.store';

    export let showBookPassageSelectorPane: boolean;

    $: availableGuidesPromise = fetchAvailableGuides($selectedBibleSection, $settings, $currentLanguageInfo, $isOnline);

    async function fetchAvailableGuides(
        bibleSection: BibleSection | null,
        settings: Setting[],
        _currentLanguageInfo: Language | undefined,
        _online: boolean
    ) {
        let guides: ApiParentResource[] | undefined;
        if (bibleSection) {
            guides = await guidesAvailableForBibleSection(bibleSection);
        } else {
            guides = await guidesAvailableInCurrentLanguage();
        }
        if (guides) {
            return filterGuidesPerSettings(guides, settings);
        } else {
            return null;
        }
    }

    function selectGuideAndHandleMenu(guideResource: ApiParentResource) {
        setCurrentGuide(guideResource);
    }

    function filterGuidesPerSettings(availableGuides: ApiParentResource[], $settings: Setting[]) {
        const srvOnlySetting = $settings.find(
            (setting) => setting.shortName === SettingShortNameEnum.showOnlySrvResources
        );

        if (srvOnlySetting?.value === true) {
            return availableGuides.filter((guide) =>
                srvOnlySetting.parentResources.includes(guide.shortName as ParentResourceName)
            );
        }

        return availableGuides;
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
    {#await availableGuidesPromise}
        <FullPageSpinner />
    {:then availableGuides}
        <div class="flex w-full flex-col items-center overflow-y-auto">
            {#if !availableGuides || availableGuides.length === 0}
                <h3 class="my-2">
                    {$translate('page.guideMenu.noGuides.value')}
                </h3>
            {:else}
                {#each availableGuides as guideResource}
                    {@const isCurrentGuide = guideResource.shortName === $currentGuide?.shortName}
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
            {/if}
        </div>
        {#if !!availableGuides && availableGuides.length > 0}
            <div class="mb-24 flex flex-grow items-end px-4">
                <button disabled={!$currentGuide} on:click={openGuideMenu} class="btn btn-primary w-full"
                    >{$translate('page.guideMenu.selectGuide.value')}</button
                >
            </div>
        {/if}
    {/await}
</div>
