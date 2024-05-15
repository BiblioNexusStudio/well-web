<script lang="ts">
    import LibraryIcon from '$lib/icons/LibraryIcon.svelte';
    import MenuIcon from '$lib/icons/MenuIcon.svelte';
    import BookIcon from '$lib/icons/BookIcon.svelte';
    import AudioPlayer from '$lib/components/AudioPlayer.svelte';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import type { CupertinoPane } from 'cupertino-pane';
    import { _ as translate } from 'svelte-i18n';
    import CompassIcon from '$lib/icons/CompassIcon.svelte';
    import NavMenuTabItem from '$lib/components/NavMenuTabItem.svelte';
    import ButtonCarousel from '$lib/components/ButtonCarousel.svelte';
    import TopNavBar from '$lib/components/TopNavBar.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import {
        createMultiClipAudioState,
        type MultiClipAudioState,
        type AudioFileInfo,
    } from '$lib/components/AudioPlayer/audio-player-state';
    import { objectKeys } from '$lib/utils/typesafe-standard-lib';
    import {
        type BibleData,
        type ResourceData,
        fetchBibleContent,
        type PassagePageTab,
        fetchResourceData,
        fetchBibleData,
    } from './data-fetchers';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
    import type { BibleBookContentDetails, FrontendBibleBook } from '$lib/types/bible';
    import { cacheBibleMetadata, cacheBiblesForBibleSection } from '$lib/utils/data-handlers/bible';
    import { isOnline } from '$lib/stores/is-online.store';
    import { lookupLanguageInfoById } from '$lib/stores/language.store';
    import MainMenu from '$lib/components/MainMenu.svelte';
    import { currentGuide, locallyStoredGuide } from '$lib/stores/parent-resource.store';
    import {
        PassagePageMenuEnum,
        passagePageShownMenu,
        openMainMenu,
        closeAllPassagePageMenus,
        openLibraryMenu,
        openGuideMenu,
        openBibleMenu,
    } from '$lib/stores/passage-page.store';
    import GuideMenu from './guide-menu/GuideMenu.svelte';
    import { onMount } from 'svelte';
    import LibraryMenu from './library-menu/LibraryMenu.svelte';
    import BibleMenu from './bible-menu/BibleMenu.svelte';
    import BookPassageSelectorPane from './bible-menu/BookPassageSelectorPane.svelte';
    import BookChapterSelectorPane from './bible-menu/BookChapterSelectorPane.svelte';
    import type { ApiParentResource } from '$lib/types/resource';
    import { selectedBibleSection } from '$lib/stores/passage-form.store';
    import SettingsMenu from './settings-menu/SettingsMenu.svelte';
    import type { BibleSection } from '$lib/types/bible';
    import BibleUnavailable from './BibleUnavailable.svelte';
    import { bibleSectionToReference } from '$lib/utils/bible-section-helpers';

    const steps = [
        $translate('resources.cbbt-er.step1.value'),
        $translate('resources.cbbt-er.step2.value'),
        $translate('resources.cbbt-er.step3.value'),
        $translate('resources.cbbt-er.step4.value'),
        $translate('resources.cbbt-er.step5.value'),
        $translate('resources.cbbt-er.step6.value'),
    ];

    let bibleData: BibleData | null = null;
    let resourceData: ResourceData | null = null;

    let cbbterSelectedStepNumber = 1;
    let stepsAvailable: number[] = [];
    let selectedBibleId: number | null = null;
    let topOfStep: HTMLElement | null = null;
    let selectedTab: PassagePageTab = 'guide';
    let isShowingBookPassageSelectorPane = false;
    let isShowingBookChapterSelectorPane = false;
    let bookPassageSelectorPane: CupertinoPane;
    let bookChapterSelectorPane: CupertinoPane;
    let cbbterSelectedStepScroll: number | undefined;
    let bibleSelectionScroll: number | undefined;
    let baseFetchPromise: Promise<[void, void]> | undefined;
    let resourceFetchPromise: Promise<void> | undefined;
    let multiClipAudioStates: Record<string, MultiClipAudioState> = {};
    let preferredBiblesModalOpen = false;

    $: {
        baseFetchPromise = fetchBase($selectedBibleSection); // when the Bible section changes, refetch
    }
    $: handlePreferredBiblesChange($preferredBibleIds);
    $: fetchContentForBibleId(selectedBibleId);

    $: cbbterSelectedStepNumber && topOfStep?.scrollIntoView();
    $: audioPlayerKey =
        selectedTab === 'bible' ? bibleAudioKey(selectedBibleId) : cbbterAudioKey(cbbterSelectedStepNumber);
    $: audioPlayerShowing = !!multiClipAudioStates[audioPlayerKey];
    $: currentBible = bibleData?.biblesForTabs.find((bible) => bible.id === selectedBibleId);

    $: setStoredGuide($locallyStoredGuide);

    function setStoredGuide(guide: ApiParentResource | undefined) {
        if (guide) {
            $currentGuide = guide;
        }
    }

    function fetchBase(bibleSection: BibleSection | null) {
        resourceData = null;
        bibleData = null;
        multiClipAudioStates = {};

        return Promise.all([fetchBibles(bibleSection), fetchResources(bibleSection)]);
    }

    function fetchResources(bibleSection: BibleSection | null) {
        if (bibleSection) {
            resourceFetchPromise = (async () => {
                resourceData = await fetchResourceData(bibleSection);
                stepsAvailable = Array.from(
                    new Set([
                        ...(resourceData.cbbterText?.steps?.map((step) => step.stepNumber) ?? []),
                        ...(resourceData.cbbterAudio?.steps?.map((step) => step.stepNumber) ?? []),
                    ])
                );
                cbbterSelectedStepNumber = stepsAvailable[0] ?? 1;
                cbbterSelectedStepScroll = stepsAvailable[0] ?? 1;
                populateCbbterAudioState();
            })();
        }
    }

    async function handlePreferredBiblesChange(preferredBibleIds: number[]) {
        fetchBibles($selectedBibleSection);
        cacheBibleMetadata(preferredBibleIds);
    }

    async function fetchBibles(bibleSection: BibleSection | null) {
        if (bibleSection) {
            const existingContent = Object.fromEntries(
                bibleData?.biblesForTabs.map(({ id, content }) => [id, content]) ?? []
            );
            const newBibleData = await fetchBibleData(bibleSection);
            newBibleData.biblesForTabs = newBibleData.biblesForTabs.map((bible) => ({
                ...bible,
                content: existingContent[bible.id] ?? null,
                loadingContent: false,
            }));
            bibleData = newBibleData;
            if (!selectedBibleId || !bibleData?.biblesForTabs.map(({ id }) => id).includes(selectedBibleId)) {
                selectedBibleId = bibleData?.biblesForTabs?.[0]?.id ?? null;
            }
            await fetchContentForBibleId(selectedBibleId);
            await cacheNonSelectedBiblesIfOnline();
        }
    }

    async function fetchContentForBibleId(id: number | null) {
        const index = bibleData?.biblesForTabs.findIndex((bible) => bible.id === id) ?? -1;
        if (bibleData && bibleData.biblesForTabs[index]) {
            bibleData.biblesForTabs[index]!.loadingContent = true;
            const bibleBook = bibleData.biblesForTabs[index];
            if (bibleBook && $selectedBibleSection) {
                if (!bibleBook.content) {
                    const content = await fetchBibleContent($selectedBibleSection, bibleBook);
                    // make sure the index hasn't changed
                    if (bibleData.biblesForTabs[index]!.id === id) {
                        bibleData.biblesForTabs[index]!.content = content;
                        populateBibleAudioState();
                    }
                }
            }
            const currentIndex = bibleData.biblesForTabs.findIndex((bible) => bible.id === id) ?? -1;
            if (currentIndex >= 0 && bibleData?.biblesForTabs[currentIndex]) {
                bibleData.biblesForTabs[currentIndex]!.loadingContent = false;
            }
        }
    }

    // in order to make sure content is available when the user goes offline, cache all the Bible data for each
    // non-selected tab
    async function cacheNonSelectedBiblesIfOnline() {
        if ($isOnline && $selectedBibleSection && bibleData?.biblesForTabs) {
            await cacheBiblesForBibleSection(
                $selectedBibleSection,
                bibleData?.biblesForTabs
                    .filter(({ id, bookMetadata }) => id !== selectedBibleId && bookMetadata !== null)
                    .map(({ bookMetadata }) => bookMetadata) as BibleBookContentDetails[]
            );
        }
    }

    // Populate the audio state object with key/values like
    //   bible1 => MultiClipAudioState
    //   bible2 => MultiClipAudioState
    function populateBibleAudioState() {
        if (bibleData) {
            bibleData.biblesForTabs.forEach((bible) => {
                if (!Object.keys(multiClipAudioStates).includes(bibleAudioKey(bible.id))) {
                    const bibleAudioFiles = (
                        bible.content?.chapters?.map(({ audioData }) => audioData).filter(Boolean) || []
                    ).map((data) => ({
                        url: data?.url,
                        startTime: data?.startTimestamp || 0,
                        endTime: data?.endTimestamp,
                        type: audioFileTypeForBrowser(),
                    })) as AudioFileInfo[];
                    if (bibleAudioFiles.length) {
                        multiClipAudioStates[bibleAudioKey(bible.id)] = createMultiClipAudioState(bibleAudioFiles);
                    }
                }
            });
        }
    }

    // Populate the audio state object with key/values like
    //   guideStep1 => MultiClipAudioState
    //   guideStep2 => MultiClipAudioState
    function populateCbbterAudioState() {
        resourceData?.cbbterAudio?.steps.forEach((step) => {
            multiClipAudioStates[cbbterAudioKey(step.stepNumber)] = createMultiClipAudioState([
                { url: step.url, type: audioFileTypeForBrowser(), startTime: 0 },
            ]);
        });
    }

    function cbbterAudioKey(step: number) {
        return `guideStep${step}`;
    }

    function bibleAudioKey(id: number | null) {
        return id === null ? 'none' : `bible${id}`;
    }

    function showOrDismissBookPassageSelectorPane(show: boolean) {
        if (show) {
            bookPassageSelectorPane?.present({ animate: true });
        } else {
            bookPassageSelectorPane?.hide();
        }
    }

    function showOrDismissBookChapterSelectorPane(show: boolean) {
        if (show) {
            bookChapterSelectorPane?.present({ animate: true });
        } else {
            bookChapterSelectorPane?.hide();
        }
    }

    function calculateBibleSectionTitle(
        currentBible: FrontendBibleBook | undefined,
        bibleSection: BibleSection | null
    ) {
        if (bibleSection) {
            return `${currentBible?.bookMetadata?.displayName ?? ''} ${bibleSectionToReference(bibleSection)}`;
        } else {
            return '';
        }
    }

    function closeAllPaneMenus() {
        isShowingBookPassageSelectorPane = false;
        isShowingBookChapterSelectorPane = false;
    }

    function handleSelectedTabMenu(tab: string) {
        if (tab === 'libraryMenu') {
            openLibraryMenu();
        } else if (tab === 'guide' && $currentGuide === undefined) {
            openGuideMenu();
        } else if (tab === 'guide' && $selectedBibleSection === null) {
            openGuideMenu();
        } else if (tab === 'guide' && stepsAvailable.length === 0) {
            openGuideMenu();
        } else if (tab === 'mainMenu') {
            openMainMenu();
        } else if (tab === 'bible' && $selectedBibleSection === null) {
            openBibleMenu();
        } else {
            closeAllPassagePageMenus();
            closeAllPaneMenus();
        }
    }

    $: bibleSectionTitle = calculateBibleSectionTitle(currentBible, $selectedBibleSection);
    $: handleSelectedTabMenu(selectedTab);

    $: showOrDismissBookPassageSelectorPane(isShowingBookPassageSelectorPane);
    $: showOrDismissBookChapterSelectorPane(isShowingBookChapterSelectorPane);

    onMount(() => {
        if (!$currentGuide) {
            openGuideMenu();
        }
    });
</script>

<BookPassageSelectorPane bind:bookPassageSelectorPane bind:isShowing={isShowingBookPassageSelectorPane} />
<BookChapterSelectorPane bind:bookChapterSelectorPane bind:isShowing={isShowingBookChapterSelectorPane} />

<div class="btm-nav z-40 h-20 border-t">
    <NavMenuTabItem bind:selectedTab tabName="bible" label={$translate('page.passage.nav.bible.value')}>
        <BookIcon />
    </NavMenuTabItem>
    <NavMenuTabItem bind:selectedTab tabName="guide" label={$translate('page.passage.nav.guide.value')}>
        <CompassIcon />
    </NavMenuTabItem>
    {#if resourceData?.additionalResources?.length}
        <NavMenuTabItem bind:selectedTab tabName="libraryMenu" label={$translate('page.passage.nav.library.value')}>
            <LibraryIcon />
        </NavMenuTabItem>
    {/if}
    <NavMenuTabItem bind:selectedTab tabName="mainMenu" label={$translate('page.passage.nav.menu.value')}>
        <MenuIcon />
    </NavMenuTabItem>
</div>

<div id="passage-page" class="h-full w-full">
    {#await baseFetchPromise}
        <FullPageSpinner />
    {:then}
        {#if $passagePageShownMenu === null}
            <TopNavBar
                bind:preferredBiblesModalOpen
                {bibleSectionTitle}
                bibleSection={$selectedBibleSection}
                bibles={bibleData?.availableBibles ?? []}
                tab={selectedTab}
                guideShortName={$currentGuide?.shortName ?? ''}
                bind:showBookChapterVerseMenu={isShowingBookChapterSelectorPane}
                bind:showBookPassageSelectorPane={isShowingBookPassageSelectorPane}
            />
        {/if}
        <div
            class="absolute left-0 right-0 top-16 flex flex-col {$passagePageShownMenu !== null &&
                'hidden'} {audioPlayerShowing ? 'bottom-[8.5rem]' : 'bottom-20'}"
        >
            {#if selectedBibleId !== -1 && (bibleData?.biblesForTabs.length ?? 0) > 1}
                <div class="px-4 pb-4 {selectedTab !== 'bible' && 'hidden'}">
                    <div class="m-auto max-w-[65ch]">
                        <ButtonCarousel
                            bind:selectedValue={selectedBibleId}
                            bind:scroll={bibleSelectionScroll}
                            buttons={(bibleData?.biblesForTabs ?? []).map((bible) => ({
                                value: bible.id,
                                label: bible.abbreviation,
                            }))}
                        />
                    </div>
                </div>
            {/if}
            <div class="flex flex-grow overflow-y-hidden px-4 {selectedTab !== 'bible' && 'hidden'}">
                {#if selectedBibleId === null}
                    <BibleUnavailable bind:preferredBiblesModalOpen bibles={bibleData?.availableBibles} />
                {:else if currentBible?.loadingContent}
                    <FullPageSpinner />
                {:else if currentBible?.content?.chapters?.length}
                    <div class="flex-start prose w-full overflow-y-scroll">
                        {#each currentBible?.content.chapters as chapter}
                            {#each chapter.versesText as { number, text }}
                                <div
                                    class="py-1"
                                    dir={lookupLanguageInfoById(currentBible.languageId)?.scriptDirection}
                                >
                                    <span class="sup pe-1">{number}</span><span>{@html text}</span>
                                </div>
                            {/each}
                        {/each}
                    </div>
                {:else}
                    <div></div>
                {/if}
            </div>
            {#await resourceFetchPromise}
                {#if selectedTab === 'guide'}
                    <FullPageSpinner />
                {/if}
            {:then}
                <div class="px-4 pb-4 {selectedTab !== 'guide' && 'hidden'}">
                    <div class="relative m-auto max-w-[65ch]">
                        <ButtonCarousel
                            bind:selectedValue={cbbterSelectedStepNumber}
                            bind:scroll={cbbterSelectedStepScroll}
                            buttons={stepsAvailable.map((stepNumber) => ({
                                value: stepNumber,
                                label: steps[stepNumber - 1] ?? '',
                            }))}
                            displayIcons={true}
                        />
                    </div>
                </div>
                <div class="flex flex-grow overflow-y-hidden px-4 {selectedTab !== 'guide' && 'hidden'}">
                    <div class="prose mx-auto flex flex-grow">
                        <span bind:this={topOfStep} />
                        <div class="flex flex-grow">
                            {#if stepsAvailable.length > 0}
                                {#each stepsAvailable as stepNumber}
                                    {@const contentHTML = resourceData?.cbbterText?.steps?.find(
                                        (step) => step.stepNumber === stepNumber
                                    )?.contentHTML}
                                    <div
                                        class={cbbterSelectedStepNumber === stepNumber
                                            ? 'flex flex-grow flex-col'
                                            : 'hidden'}
                                    >
                                        <div class="flex-grow overflow-y-scroll">
                                            {#if contentHTML}
                                                {@html contentHTML}
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            {:else}
                                {$translate('page.passage.noCbbterContent.value')}
                            {/if}
                        </div>
                    </div>
                </div>
            {/await}
        </div>
        {#if objectKeys(multiClipAudioStates).length}
            <div
                class="fixed bottom-20 left-0 right-0 z-10 m-auto flex h-14 max-w-[65ch] justify-items-center bg-base-100 px-4 {(!audioPlayerShowing ||
                    $passagePageShownMenu !== null) &&
                    'hidden'}"
            >
                <AudioPlayer {multiClipAudioStates} currentClipKey={audioPlayerKey} />
            </div>
        {/if}
    {:catch}
        <ErrorMessage />
    {/await}
    {#if $passagePageShownMenu === PassagePageMenuEnum.main}
        <MainMenu />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.guide}
        <GuideMenu bind:showBookPassageSelectorPane={isShowingBookPassageSelectorPane} />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.library}
        <LibraryMenu resources={resourceData?.additionalResources} />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.bible}
        <BibleMenu bind:showBookChapterVerseMenu={isShowingBookChapterSelectorPane} />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.settings}
        <SettingsMenu />
    {/if}
</div>
