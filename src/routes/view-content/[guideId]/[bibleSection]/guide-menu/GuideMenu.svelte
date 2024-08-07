<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { settings } from '$lib/stores/settings.store';
    import type { Setting } from '$lib/types/settings';
    import { PredeterminedPassageGuides } from '$lib/types/resource';
    import {
        guidesAvailableForBibleSection,
        guidesAvailableInCurrentLanguage,
    } from '$lib/utils/data-handlers/resources/guides';
    import type { Language } from '$lib/types/file-manager';
    import type { BibleSection } from '$lib/types/bible';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { isOnline } from '$lib/stores/is-online.store';
    import SwishHeader from '$lib/components/SwishHeader.svelte';
    import { getContentContext } from '../context';
    import Spinner from '$lib/components/Spinner.svelte';

    const {
        currentGuide,
        isLoadingToOpenPane,
        openPredeterminedPassageSelectorPane,
        openBookChapterSelectorPane,
        closeContextualMenu,
        currentBibleSection,
        setCurrentGuide,
    } = getContentContext();

    $: selectedGuide = $currentGuide;

    $: availableGuidesPromise = fetchAvailableGuides($currentBibleSection, $settings, $currentLanguageInfo, $isOnline);

    async function fetchAvailableGuides(
        bibleSection: BibleSection | null,
        _settings: Setting[],
        _currentLanguageInfo: Language | undefined,
        _online: boolean
    ) {
        if (bibleSection) {
            return await guidesAvailableForBibleSection(bibleSection);
        } else {
            return await guidesAvailableInCurrentLanguage();
        }
    }

    async function openGuideMenu() {
        // When using a selector pane we aren't immediately setting the guide, but are instead relying on
        // the passage selector to set the guide once the user finishes passage selection. This prevents the following:
        //   - User selects guide, background fetch happens for current Bible section
        //   - User selects new Bible section, previous fetch data is wasted and now a new fetch happens
        // In addition to preventing extra network calls it prevents jarring page flashes that come from loading indicators.
        if (selectedGuide && PredeterminedPassageGuides.includes(selectedGuide.id)) {
            openPredeterminedPassageSelectorPane(selectedGuide, false);
        } else if (!$currentBibleSection) {
            openBookChapterSelectorPane(selectedGuide);
        } else {
            closeContextualMenu();
            setCurrentGuide(selectedGuide);
        }
    }
</script>

<div class="z-50 flex h-full w-full flex-col">
    <SwishHeader
        bgcolor="bg-[#EAAA08]"
        title={$translate('page.guideMenu.translationGuides.value')}
        subtitle={$translate('page.guideMenu.chooseGuide.value')}
    />
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
                    {@const isCurrentGuide = guideResource.id === selectedGuide?.id}
                    <button
                        on:click={() => (selectedGuide = guideResource)}
                        class="my-2 flex w-11/12 rounded-xl p-4 {isCurrentGuide
                            ? 'border-2 border-[#3db6e7] bg-[#f0faff]'
                            : 'border'}"
                        data-app-insights-event-name="guide-menu-resource-selected"
                        data-app-insights-dimensions={`guideResource,${guideResource.displayName}`}
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
                <button
                    disabled={!selectedGuide || $isLoadingToOpenPane}
                    on:click={openGuideMenu}
                    class="btn btn-primary w-full"
                    data-app-insights-event-name="guide-menu-select-guide-button-clicked"
                >
                    {#if $isLoadingToOpenPane}
                        <Spinner />
                    {:else}
                        {$translate('page.bibleMenu.goToGuide.value')}
                    {/if}
                </button>
            </div>
        {/if}
    {/await}
</div>
