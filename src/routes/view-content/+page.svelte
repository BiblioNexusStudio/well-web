<script lang="ts">
    import LibraryIcon from '$lib/icons/LibraryIcon.svelte';
    import ClipboardIcon from '$lib/icons/ClipboardIcon.svelte';
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
        PassagePageTabEnum,
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
        openResourcesMenu,
    } from '$lib/stores/passage-page.store';
    import GuideMenu from './guide-menu/GuideMenu.svelte';
    import { onMount } from 'svelte';
    import LibraryResourceMenu from './library-resource-menu/LibraryResourceMenu.svelte';
    import BibleMenu from './bible-menu/BibleMenu.svelte';
    import BookPassageSelectorPane from './bible-menu/BookPassageSelectorPane.svelte';
    import BookChapterSelectorPane from './bible-menu/BookChapterSelectorPane.svelte';
    import {
        MediaType,
        type ApiParentResource,
        type ResourceContentInfoWithMetadata,
        type TextResourceContentJustId,
    } from '$lib/types/resource';
    import { selectedBibleSection } from '$lib/stores/passage-form.store';
    import SettingsMenu from './settings-menu/SettingsMenu.svelte';
    import type { BibleSection } from '$lib/types/bible';
    import BibleUnavailable from './BibleUnavailable.svelte';
    import { bibleSectionToReference } from '$lib/utils/bible-section-helpers';
    import QuickShare from './quick-share/QuickShare.svelte';
    import GuideContent from './guide-content/GuideContent.svelte';
    import FullscreenTextResource from './library-resource-menu/FullscreenTextResource.svelte';

    let bibleData: BibleData | null = null;
    let resourceData: ResourceData | null = null;
    let fullscreenTextResourceStack: (ResourceContentInfoWithMetadata | TextResourceContentJustId)[] = [];

    let selectedBibleId: number | null = null;
    let selectedTab = PassagePageTabEnum.Guide;
    let isShowingBookPassageSelectorPane = false;
    let isShowingBookChapterSelectorPane = false;
    let bookPassageSelectorPane: CupertinoPane;
    let bookChapterSelectorPane: CupertinoPane;
    let bibleSelectionScroll: number | undefined;
    let baseFetchPromise: Promise<[void, void]> | undefined;
    let resourceFetchPromise: Promise<void> | undefined;
    let multiClipAudioStates: Record<string, MultiClipAudioState> = {};
    let preferredBiblesModalOpen = false;
    let audioPlayerKey: string | undefined;

    $: {
        baseFetchPromise = fetchBase($selectedBibleSection); // when the Bible section changes, refetch
    }
    $: handlePreferredBiblesChange($preferredBibleIds);
    $: fetchContentForBibleId(selectedBibleId);

    $: selectedTab === PassagePageTabEnum.Bible && setBibleAudioPlayerForBible(selectedBibleId);
    $: audioPlayerShowing = audioPlayerKey && !!multiClipAudioStates[audioPlayerKey];
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

    function bibleAudioKey(id: number | null) {
        return id === null ? 'none' : `bible${id}`;
    }

    function setBibleAudioPlayerForBible(id: number | null) {
        audioPlayerKey = bibleAudioKey(id);
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

    function handleSelectedTabMenu(tab: PassagePageTabEnum) {
        if (tab === PassagePageTabEnum.LibraryMenu) {
            openLibraryMenu();
        } else if (tab === PassagePageTabEnum.Resources) {
            openResourcesMenu();
        } else if (
            tab === PassagePageTabEnum.Guide &&
            ($currentGuide === undefined || $selectedBibleSection === null)
        ) {
            openGuideMenu();
        } else if (tab === PassagePageTabEnum.MainMenu) {
            openMainMenu();
        } else if (tab === PassagePageTabEnum.Bible && $selectedBibleSection === null) {
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

        window.onResourceReferenceClick = (contentId: number) => {
            fullscreenTextResourceStack.push({ id: contentId, mediaType: MediaType.Text });
            fullscreenTextResourceStack = fullscreenTextResourceStack;
        };

        return () => {
            window.onResourceReferenceClick = undefined;
        };
    });
</script>

<BookPassageSelectorPane
    bind:bookPassageSelectorPane
    bind:isShowing={isShowingBookPassageSelectorPane}
    bind:tab={selectedTab}
/>
<BookChapterSelectorPane
    bind:bookChapterSelectorPane
    bind:isShowing={isShowingBookChapterSelectorPane}
    filterByCurrentGuide={selectedTab === PassagePageTabEnum.Guide}
/>

<FullscreenTextResource bind:fullscreenTextResourceStack />

<div class="btm-nav z-40 h-20 border-t">
    <NavMenuTabItem
        bind:selectedTab
        tabName={PassagePageTabEnum.Bible}
        label={$translate('page.passage.nav.bible.value')}
    >
        <BookIcon />
    </NavMenuTabItem>
    <NavMenuTabItem
        bind:selectedTab
        tabName={PassagePageTabEnum.Guide}
        label={$translate('page.passage.nav.guide.value')}
    >
        <CompassIcon />
    </NavMenuTabItem>
    {#if resourceData?.additionalResourceInfo?.length}
        <NavMenuTabItem
            bind:selectedTab
            tabName={PassagePageTabEnum.Resources}
            label={$translate('page.passage.nav.resources.value')}
        >
            <ClipboardIcon />
        </NavMenuTabItem>
    {/if}
    {#if $isOnline}
        <NavMenuTabItem
            bind:selectedTab
            tabName={PassagePageTabEnum.LibraryMenu}
            label={$translate('page.passage.nav.library.value')}
        >
            <LibraryIcon />
        </NavMenuTabItem>
    {/if}
    <NavMenuTabItem
        bind:selectedTab
        tabName={PassagePageTabEnum.MainMenu}
        label={$translate('page.passage.nav.menu.value')}
    >
        <MenuIcon />
    </NavMenuTabItem>
</div>

<div id="passage-page" class="h-full w-full">
    {#await baseFetchPromise}
        <FullPageSpinner />
    {:then}
        {#if $passagePageShownMenu === null || $passagePageShownMenu === PassagePageMenuEnum.resources}
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
                <div class="px-4 pb-4 {selectedTab !== PassagePageTabEnum.Bible && 'hidden'}">
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
            <div class="flex flex-grow overflow-y-hidden px-4 {selectedTab !== PassagePageTabEnum.Bible && 'hidden'}">
                {#if selectedBibleId === null}
                    <BibleUnavailable bind:preferredBiblesModalOpen bibles={bibleData?.availableBibles} />
                {:else if currentBible?.loadingContent}
                    <FullPageSpinner />
                {:else if currentBible?.content?.chapters?.length}
                    <div class="flex-start prose mx-auto w-full overflow-y-scroll">
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
                {#if selectedTab === PassagePageTabEnum.Guide}
                    <FullPageSpinner />
                {/if}
            {:then}
                <GuideContent
                    bind:multiClipAudioStates
                    bind:audioPlayerKey
                    currentGuide={$currentGuide}
                    guideResourceInfo={resourceData?.guideResourceInfo}
                    isShowing={selectedTab === PassagePageTabEnum.Guide}
                />
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
        <GuideMenu
            bind:showBookChapterVerseMenu={isShowingBookChapterSelectorPane}
            bind:showBookPassageSelectorPane={isShowingBookPassageSelectorPane}
        />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.resources}
        <LibraryResourceMenu
            bind:fullscreenTextResourceStack
            resources={resourceData?.additionalResourceInfo}
            tab={selectedTab}
        />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.library}
        <LibraryResourceMenu bind:fullscreenTextResourceStack resources={undefined} tab={selectedTab} />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.bible}
        <BibleMenu bind:showBookChapterVerseMenu={isShowingBookChapterSelectorPane} />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.settings}
        <SettingsMenu />
    {/if}
    {#if $passagePageShownMenu === PassagePageMenuEnum.share}
        <QuickShare />
    {/if}
</div>
