<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { settings } from '$lib/stores/settings.store';
    import { SettingShortNameEnum, type Setting } from '$lib/types/settings';
    import {
        PredeterminedPassageGuides,
        DraftingGuides,
        CheckingGuides,
        type ApiParentResource,
    } from '$lib/types/resource';
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
    import GuideList from './GuideList.svelte';
    import MenuButton from '../MenuButton.svelte';
    import GuideExplanation from './GuideExplanation.svelte';

    enum GuideMenuPage {
        All = 'All',
        Drafting = 'Drafting',
        Checking = 'Checking',
        Explanation = 'Explanation',
    }

    const {
        openPredeterminedPassageSelectorPane,
        openBookChapterSelectorPane,
        closeContextualMenu,
        currentBibleSection,
        setCurrentGuide,
    } = getContentContext();

    let currentPage: GuideMenuPage | null = null;
    let isLockedToSrv = false;

    $: availableGuidesPromise = fetchAvailableGuides($currentBibleSection, $settings, $currentLanguageInfo, $isOnline);

    $: {
        availableGuidesPromise.then((_) => {
            const showOnlySrvResources = !!$settings.find(
                (setting) => setting.shortName === SettingShortNameEnum.showOnlySrvResources
            )?.value;
            isLockedToSrv = showOnlySrvResources;
            if (isLockedToSrv) {
                currentPage = GuideMenuPage.Drafting;
            }
        });
    }

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

    async function selectGuide(selectedGuide: ApiParentResource) {
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

    function filterToCheckingGuides(guides: ApiParentResource[]) {
        return guides.filter((guide) => CheckingGuides.includes(guide.id));
    }

    function filterToDraftingGuides(guides: ApiParentResource[]) {
        return guides.filter((guide) => DraftingGuides.includes(guide.id));
    }
</script>

<div class="z-50 flex h-full w-full flex-col items-center pb-20">
    <SwishHeader
        bgcolor="bg-[#EAAA08]"
        title={$translate('page.guideMenu.translationGuides.value')}
        subtitle={$translate('page.guideMenu.chooseGuide.value')}
    />
    {#await availableGuidesPromise}
        <FullPageSpinner />
    {:then availableGuides}
        {@const draftingGuides = filterToDraftingGuides(availableGuides)}
        {@const checkingGuides = filterToCheckingGuides(availableGuides)}
        <div class="flex w-full max-w-[65ch] flex-col items-center overflow-y-auto pb-2">
            {#if currentPage === null}
                <div class="text-md py-2 text-center">{$translate('page.guideMenu.whatWouldYouLikeToDo.value')}</div>
                {#if draftingGuides.length}
                    <MenuButton
                        onClick={() => (currentPage = GuideMenuPage.Drafting)}
                        data-app-insights-event-name="guide-menu-start-drafting"
                    >
                        {$translate('page.guideMenu.startDraftingTranslation.value')}
                    </MenuButton>
                {/if}
                {#if checkingGuides.length}
                    <MenuButton
                        onClick={() => (currentPage = GuideMenuPage.Checking)}
                        data-app-insights-event-name="guide-menu-start-checking"
                    >
                        {$translate('page.guideMenu.checkTranslation.value')}
                    </MenuButton>
                {/if}
                {#if checkingGuides.length && draftingGuides.length}
                    <MenuButton
                        onClick={() => (currentPage = GuideMenuPage.Explanation)}
                        data-app-insights-event-name="guide-menu-see-explanation"
                    >
                        {$translate('page.guideMenu.helpMeChoose.value')}
                    </MenuButton>
                {/if}
                <MenuButton
                    onClick={() => (currentPage = GuideMenuPage.All)}
                    data-app-insights-event-name="guide-menu-all-guides"
                >
                    {$translate('page.guideMenu.showAllGuides.value')}
                </MenuButton>
            {:else if currentPage === GuideMenuPage.All}
                <GuideList
                    back={() => (currentPage = null)}
                    title={$translate('page.guideMenu.allGuides.value')}
                    guides={availableGuides}
                    {selectGuide}
                />
            {:else if currentPage === GuideMenuPage.Checking}
                <GuideList
                    back={() => (currentPage = null)}
                    title={$translate('page.guideMenu.checkingGuides.value')}
                    guides={checkingGuides}
                    {selectGuide}
                />
            {:else if currentPage === GuideMenuPage.Drafting}
                <GuideList
                    back={isLockedToSrv ? null : () => (currentPage = null)}
                    title={$translate('page.guideMenu.draftingGuides.value')}
                    guides={draftingGuides}
                    {selectGuide}
                />
            {:else if currentPage === GuideMenuPage.Explanation}
                <GuideExplanation
                    back={() => (currentPage = null)}
                    showDrafting={() => (currentPage = GuideMenuPage.Drafting)}
                    showChecking={() => (currentPage = GuideMenuPage.Checking)}
                />
            {/if}
        </div>
    {/await}
</div>
