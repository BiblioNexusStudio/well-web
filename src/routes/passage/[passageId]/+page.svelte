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
    import { page } from '$app/stores';
    import {
        type BibleData,
        type ResourceData,
        fetchBibleContent,
        type PassagePageTab,
        fetchPassage,
        fetchResourceData,
        fetchBibleData,
        fetchLocalizedGuideData,
    } from './data-fetchers';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
    import type { BibleBookContentDetails, FrontendBibleBook } from '$lib/types/bible-text-content';
    import type { BasePassage } from '$lib/types/passage';
    import { cacheBiblesForPassage } from '$lib/utils/data-handlers/bible';
    import { isOnline } from '$lib/stores/is-online.store';
    import { currentLanguageInfo, lookupLanguageInfoById } from '$lib/stores/language.store';
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
    import GuidePane from './guide-menu/GuidePane.svelte';
    import LibraryMenu from './library-menu/LibraryMenu.svelte';
    import BibleMenu from './bible-menu/BibleMenu.svelte';
    import {
        bibleSetByUser,
        bibleStoredByUser,
        bibleDataFetchedByUser,
        loadingContent,
    } from '$lib/stores/bibles.store';
    import BiblePane from './bible-menu/BiblePane.svelte';
    import BookPassageSelectorPane from './bible-menu/BookPassageSelectorPane.svelte';
    import BookChapterSelectorPane from './bible-menu/BookChapterSelectorPane.svelte';
    import type { BaseBible } from '$lib/types/bible-text-content';
    import type { ApiParentResource } from '$lib/types/resource';
    import { selectedBookIndex, selectedId } from '$lib/stores/passage-form.store';
    import SettingsMenu from './settings-menu/SettingsMenu.svelte';
    import type { ApiBibleContents } from '$lib/types/bible-text-content.ts';

    const steps = [
        $translate('resources.cbbt-er.step1.value'),
        $translate('resources.cbbt-er.step2.value'),
        $translate('resources.cbbt-er.step3.value'),
        $translate('resources.cbbt-er.step4.value'),
        $translate('resources.cbbt-er.step5.value'),
        $translate('resources.cbbt-er.step6.value'),
    ];

    let passage: BasePassage | null = null;
    let bibleData: BibleData | null = null;
    let resourceData: ResourceData | null = null;

    let cbbterSelectedStepNumber = 1;
    let stepsAvailable: number[] = [];
    let selectedBibleId: number | null = null;
    let topOfStep: HTMLElement | null = null;
    let selectedTab: PassagePageTab = 'guide';
    let isShowingGuidePane = false;
    let isShowingBiblePane = false;
    let isShowingBookPassageSelectorPane = false;
    let isShowingBookChapterSelectorPane = false;
    let guidePane: CupertinoPane;
    let biblePane: CupertinoPane;
    let bookPassageSelectorPane: CupertinoPane;
    let bookChapterSelectorPane: CupertinoPane;
    let cbbterSelectedStepScroll: number | undefined;
    let bibleSelectionScroll: number | undefined;
    let baseFetchPromise: Promise<void> | undefined;
    let resourceFetchPromise: Promise<void> | undefined;
    let multiClipAudioStates: Record<string, MultiClipAudioState> = {};
    let preferredBiblesModalOpen = false;
    let localizedGuides: ApiParentResource[];

    $: $page.url && fetchBase(); // when the [passageId] changes, refetch
    $: $currentLanguageInfo?.id && fetchGuides();
    $: passage && fetchBibles(passage, $preferredBibleIds);
    $: passage && fetchResources(passage);
    $: fetchContentForBibleId(selectedBibleId);

    $: cbbterSelectedStepNumber && topOfStep?.scrollIntoView();
    $: audioPlayerKey =
        selectedTab === 'bible' ? bibleAudioKey(selectedBibleId) : cbbterAudioKey(cbbterSelectedStepNumber);
    $: audioPlayerShowing = !!multiClipAudioStates[audioPlayerKey];
    $: currentBible = bibleData?.biblesForTabs.find((bible) => bible.id === selectedBibleId);

    $: setStoredBible($bibleStoredByUser);
    $: setStoredGuide($locallyStoredGuide);

    function setStoredBible(bible: BaseBible | null) {
        if (bible && $page.params.passageId !== 'new') {
            $bibleSetByUser = bible;
        }
    }

    function setStoredGuide(guide: ApiParentResource | undefined) {
        if (guide && $page.params.passageId !== 'new') {
            $currentGuide = guide;
        }
    }

    async function fetchGuides() {
        localizedGuides = await fetchLocalizedGuideData();
    }

    function fetchBase() {
        if ($page.params.passageId === 'new') {
            $bibleSetByUser = null;
            $currentGuide = undefined;
            $selectedBookIndex = 'default';
            $selectedId = 'default';

            openGuideMenu();
            return;
        }
        passage = null;
        resourceData = null;
        bibleData = null;
        multiClipAudioStates = {};
        baseFetchPromise = (async () => {
            passage = await fetchPassage($page.params.passageId!);
        })();
    }

    function fetchResources(passage: BasePassage) {
        resourceFetchPromise = (async () => {
            resourceData = await fetchResourceData(passage);
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

    async function fetchBibles(passage: BasePassage, _: number[]) {
        const existingContent = Object.fromEntries(
            bibleData?.biblesForTabs.map(({ id, content }) => [id, content]) ?? []
        );
        const newBibleData = await fetchBibleData(passage);
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

    async function fetchContentForBibleId(id: number | null) {
        const index = bibleData?.biblesForTabs.findIndex((bible) => bible.id === id) ?? -1;
        if (bibleData && bibleData.biblesForTabs[index]) {
            bibleData.biblesForTabs[index]!.loadingContent = true;
            const bibleBook = bibleData.biblesForTabs[index];
            if (bibleBook && passage) {
                if (!bibleBook.content) {
                    const content = await fetchBibleContent(passage, bibleBook);
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
        if ($isOnline && passage && bibleData?.biblesForTabs) {
            await cacheBiblesForPassage(
                passage,
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

    function showOrDismissGuidePane(show: boolean) {
        if (show) {
            guidePane?.present({ animate: true });
        } else {
            guidePane?.hide();
        }
    }

    function showOrDismissBiblePane(show: boolean) {
        if (show) {
            biblePane?.present({ animate: true });
        } else {
            biblePane?.hide();
        }
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

    function navbarTitle(
        resourceData: ResourceData | null,
        currentBible: FrontendBibleBook | undefined,
        selectedTab: PassagePageTab,
        selectedStepNumber: number,
        bibleContents: ApiBibleContents | null
    ) {
        if (bibleContents?.chapters?.length && bibleContents?.chapters?.length === 1) {
            let bibleContentsLength = bibleContents?.chapters?.[0]?.verses?.length;
            let titleString = `${bibleContents.bookName} ${bibleContents?.chapters?.[0]?.number}:${bibleContents?.chapters?.[0]?.verses?.[0]?.number}`;
            if (bibleContentsLength && bibleContentsLength > 1) {
                titleString += `-${
                    bibleContents?.chapters?.[0]?.verses?.[bibleContents?.chapters?.[0]?.verses?.length - 1]?.number
                }`;
            }
            return titleString;
        } else if (bibleContents?.chapters?.length && bibleContents?.chapters?.length > 1) {
            const firstChapter = bibleContents?.chapters?.[0];
            const lastChapter = bibleContents?.chapters?.[bibleContents?.chapters?.length - 1];

            return `${bibleContents.bookName} ${firstChapter?.number}:${firstChapter?.verses?.[0]?.number}-${
                lastChapter?.number
            }:${lastChapter?.verses?.[lastChapter?.verses?.length - 1]?.number}`;
        }
        if (selectedTab === 'bible' || selectedTab === 'guide') {
            if (resourceData?.cbbterText?.steps?.length && resourceData?.title) {
                return resourceData?.title;
            } else {
                return `${currentBible?.bookMetadata?.displayName ?? ''} ${
                    currentBible?.content?.chapters?.[0]?.number ?? ''
                }`;
            }
        } else if (resourceData?.title) {
            return `${resourceData?.title} - ${steps[selectedStepNumber - 1]}`;
        } else {
            return '';
        }
    }

    function closeAllPaneMenus() {
        isShowingGuidePane = false;
        isShowingBiblePane = false;
        isShowingBookPassageSelectorPane = false;
        isShowingBookChapterSelectorPane = false;
    }

    function handleSelectedTabMenu(tab: string) {
        if (tab === 'libraryMenu') {
            openLibraryMenu();
        } else if (tab === 'guide' && $currentGuide === undefined) {
            openGuideMenu();
        } else if (tab === 'mainMenu') {
            openMainMenu();
        } else if (tab === 'bible' && $bibleSetByUser === null) {
            openBibleMenu();
        } else {
            closeAllPassagePageMenus();
            closeAllPaneMenus();
        }
    }

    $: title = navbarTitle(resourceData, currentBible, selectedTab, cbbterSelectedStepNumber, $bibleDataFetchedByUser);
    $: handleSelectedTabMenu(selectedTab);

    $: showOrDismissGuidePane(isShowingGuidePane);
    $: showOrDismissBiblePane(isShowingBiblePane);
    $: showOrDismissBookPassageSelectorPane(isShowingBookPassageSelectorPane);
    $: showOrDismissBookChapterSelectorPane(isShowingBookChapterSelectorPane);

    onMount(() => {
        if (!$currentGuide) {
            openGuideMenu();
        }
    });
</script>

<GuidePane bind:selectedTab bind:guidePane bind:isShowing={isShowingGuidePane} bind:localizedGuides />
<BiblePane
    bind:biblePane
    bind:isShowing={isShowingBiblePane}
    bind:showBookPassageMenu={isShowingBookPassageSelectorPane}
    bind:showBookChapterVerseMenu={isShowingBookChapterSelectorPane}
/>
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
                {title}
                {passage}
                bibles={bibleData?.availableBibles ?? []}
                tab={selectedTab}
                guideShortName={$currentGuide?.shortName ?? ''}
                bind:showBiblePane={isShowingBookPassageSelectorPane}
                bind:showBookChapterVerseMenu={isShowingBookChapterSelectorPane}
            />
        {/if}
        <div
            class="absolute left-0 right-0 top-16 flex flex-col {$passagePageShownMenu !== null &&
                'hidden'} {audioPlayerShowing ? 'bottom-[7.5rem]' : 'bottom-20'}"
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
                {#if $loadingContent}
                    <FullPageSpinner />
                {:else if currentBible?.content?.chapters?.length}
                    <div class="prose mx-auto overflow-y-scroll">
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
                {:else if $bibleDataFetchedByUser?.chapters?.length}
                    <div class="prose mx-auto overflow-y-scroll">
                        {#each $bibleDataFetchedByUser?.chapters as chapter}
                            {#each chapter.verses as { number, text }}
                                <div
                                    class="py-1"
                                    dir={lookupLanguageInfoById($bibleSetByUser?.languageId || 1)?.scriptDirection}
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
        <GuideMenu bind:showGuideMenu={isShowingGuidePane} />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.library}
        <LibraryMenu resources={resourceData?.additionalResources} />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.bible}
        <BibleMenu bind:showBibleMenu={isShowingBiblePane} />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.settings}
        <SettingsMenu />
    {/if}
</div>
