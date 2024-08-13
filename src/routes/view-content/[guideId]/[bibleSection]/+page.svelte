<script lang="ts">
    import LibraryIcon from '$lib/icons/LibraryIcon.svelte';
    import ClipboardIcon from '$lib/icons/ClipboardIcon.svelte';
    import MenuIcon from '$lib/icons/MenuIcon.svelte';
    import BookIcon from '$lib/icons/BookIcon.svelte';
    import AudioPlayer from '$lib/components/AudioPlayer.svelte';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { _ as translate } from 'svelte-i18n';
    import CompassIcon from '$lib/icons/CompassIcon.svelte';
    import NavMenuTabItem from './NavMenuTabItem.svelte';
    import ButtonCarousel from '$lib/components/ButtonCarousel.svelte';
    import TopNavBar from './TopNavBar.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import {
        createMultiClipAudioState,
        type MultiClipAudioState,
    } from '$lib/components/AudioPlayer/audio-player-state';
    import { objectKeys } from '$lib/utils/typesafe-standard-lib';
    import {
        type BibleData,
        type ResourceData,
        fetchBibleContent,
        fetchResourceData,
        fetchBibleData,
    } from './data-fetchers';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
    import type { BibleBookContentDetails } from '$lib/types/bible';
    import {
        cacheBibleMetadata,
        cacheBiblesForBibleSection,
        getBibleBookCodesToName,
    } from '$lib/utils/data-handlers/bible';
    import { isOnline } from '$lib/stores/is-online.store';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import MainMenu from './MainMenu.svelte';
    import { guideResources } from '$lib/stores/parent-resource.store';
    import GuideMenu from './guide-menu/GuideMenu.svelte';
    import { onMount } from 'svelte';
    import LibraryResourceMenu from './library-resource-menu/LibraryResourceMenu.svelte';
    import BibleMenu from './bible-menu/BibleMenu.svelte';
    import PredeterminedPassageSelectorPane from './bible-menu/PredeterminedPassageSelectorPane.svelte';
    import BookChapterSelectorPane from './bible-menu/BookChapterSelectorPane.svelte';
    import {
        MediaType,
        type ResourceContentInfoWithMetadata,
        type TextResourceContentJustId,
    } from '$lib/types/resource';
    import type { BibleSection } from '$lib/types/bible';
    import GuideContent from './guide-content/GuideContent.svelte';
    import FullscreenTextResource from './library-resource-menu/FullscreenTextResource.svelte';
    import type { Language } from '$lib/types/file-manager';
    import { filterBoolean } from '$lib/utils/array';
    import BibleViewer from './BibleViewer.svelte';
    import { page } from '$app/stores';
    import { ContentTabEnum, createContentContext } from './context';
    import PredeterminedPassageSelectorForBibleSectionPane from './bible-menu/PredeterminedPassageSelectorForBibleSectionPane.svelte';

    const {
        currentGuide,
        currentBibleSection,
        currentTab,
        isShowingContextualMenu,
        openBookChapterSelectorPane,
        openContextualMenu,
        syncSelectedGuideFromUrlParam,
        syncSelectedBibleSectionFromUrlParam,
    } = createContentContext();

    // make sure when the URL params change the context stores get updated
    $: syncSelectedGuideFromUrlParam($guideResources, $page.params.guideId);
    $: syncSelectedBibleSectionFromUrlParam($page.params.bibleSection);

    let bibleData: BibleData | null = null;
    let resourceData: ResourceData | null = null;
    let fullscreenTextResourceStacksByTab: Map<
        ContentTabEnum,
        (ResourceContentInfoWithMetadata | TextResourceContentJustId)[]
    > = new Map();

    let currentBibleId: number | null = null;
    let alignmentModeEnabled = false;
    let bibleSelectionScroll: number | undefined;
    let baseFetchPromise: Promise<[void, void]> | undefined;
    let resourceFetchPromise: Promise<void> | undefined;
    let multiClipAudioStates: Record<string, MultiClipAudioState> = {};
    let preferredBiblesModalOpen = false;
    let audioPlayerKey: string | undefined;
    let bookCodesToNames: Map<string, string> | undefined;

    $: {
        baseFetchPromise = fetchBase($currentBibleSection); // when the Bible section changes, refetch
    }
    $: handlePreferredBiblesChange($preferredBibleIds);
    $: fetchContentForBibleId(currentBibleId);

    $: $currentTab === ContentTabEnum.Bible && setBibleAudioPlayerForBible(currentBibleId);
    $: audioPlayerShowing = audioPlayerKey && !!multiClipAudioStates[audioPlayerKey] && !alignmentModeEnabled;
    $: fetchBibleBookCodeToName($currentLanguageInfo);

    function fetchBase(bibleSection: BibleSection | null) {
        resourceData = null;
        bibleData = null;
        multiClipAudioStates = {};

        return Promise.all([fetchBibles(bibleSection), fetchResources(bibleSection)]);
    }

    function fetchResources(bibleSection: BibleSection | null) {
        if (bibleSection) {
            resourceFetchPromise = (async () => {
                resourceData = await fetchResourceData(bibleSection, $currentGuide);
            })();
        }
    }

    async function handlePreferredBiblesChange(preferredBibleIds: number[]) {
        fetchBibles($currentBibleSection);
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
            if (!currentBibleId || !bibleData?.biblesForTabs.map(({ id }) => id).includes(currentBibleId)) {
                currentBibleId = bibleData?.biblesForTabs?.[0]?.id ?? null;
            }
            await fetchContentForBibleId(currentBibleId);
            await cacheNonSelectedBiblesIfOnline();
        }
    }

    async function fetchContentForBibleId(id: number | null) {
        const index = bibleData?.biblesForTabs.findIndex((bible) => bible.id === id) ?? -1;
        if (bibleData && bibleData.biblesForTabs[index]) {
            bibleData.biblesForTabs[index]!.loadingContent = true;
            const bibleBook = bibleData.biblesForTabs[index];
            if (bibleBook && $currentBibleSection) {
                if (!bibleBook.content) {
                    const content = await fetchBibleContent($currentBibleSection, bibleBook);
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
        if ($isOnline && $currentBibleSection && bibleData?.biblesForTabs) {
            await cacheBiblesForBibleSection(
                $currentBibleSection,
                bibleData?.biblesForTabs
                    .filter(({ id, bookMetadata }) => id !== currentBibleId && bookMetadata !== null)
                    .map(({ id, bookMetadata }) => ({ ...bookMetadata, bibleId: id })) as BibleBookContentDetails[]
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
                    const bibleAudioFiles = filterBoolean(
                        bible.content?.chapters?.map(({ audioData }) => audioData)
                    ).map((data) => ({
                        url: data.url,
                        startTime: data.startTimestamp || 0,
                        endTime: data.endTimestamp,
                        type: audioFileTypeForBrowser(),
                    }));
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

    async function fetchBibleBookCodeToName(currentLanguageInfo: Language | undefined) {
        if (currentLanguageInfo) {
            bookCodesToNames = await getBibleBookCodesToName(currentLanguageInfo.id);
        }
    }

    $: isShowingBibleOrGuide =
        ($currentTab === ContentTabEnum.Bible || $currentTab === ContentTabEnum.Guide) && !$isShowingContextualMenu;

    onMount(() => {
        if (!$currentBibleSection && !$currentGuide) {
            openContextualMenu();
            openBookChapterSelectorPane(null);
        }

        window.onResourceReferenceClick = (tab: string, contentId: number) => {
            const fullscreenTextResourceStack = fullscreenTextResourceStacksByTab.get(tab as ContentTabEnum) ?? [];
            fullscreenTextResourceStack.push({
                id: contentId,
                // Because AssociatedResources are stored on metadata, we can't rely on version numbers since it could go stale.
                // Example: Resource A links to Resource B, so Resource A's metadata will include Resource B info. If Resource B
                // updates, its version number will change. If we access it from a passage then we'll get the new version number and
                // know to pull Resource B again. However if we access it from a link on Resource A, we have no way of knowing that its
                // version number changed. To resolve this, we set the version to -1 which will tell the Service Worker middleware
                // to do a StaleWhileRevalidate. This means the content loads fast from the cache but updates in the background each
                // time it's pulled.
                version: -1,
                mediaType: MediaType.Text,
            });
            fullscreenTextResourceStacksByTab.set(tab as ContentTabEnum, fullscreenTextResourceStack);
            fullscreenTextResourceStacksByTab = fullscreenTextResourceStacksByTab;
        };

        return () => {
            window.onResourceReferenceClick = undefined;
        };
    });
</script>

<PredeterminedPassageSelectorForBibleSectionPane {bookCodesToNames} />
<PredeterminedPassageSelectorPane {bookCodesToNames} />
<BookChapterSelectorPane {bookCodesToNames} />

<div class={$currentTab !== ContentTabEnum.Guide ? 'hidden' : ''}>
    <FullscreenTextResource tab={ContentTabEnum.Guide} bind:fullscreenTextResourceStacksByTab />
</div>

<div class="btm-nav z-[60] h-20 border-t">
    <NavMenuTabItem tabName={ContentTabEnum.Bible} label={$translate('page.passage.nav.bible.value')}>
        <BookIcon />
    </NavMenuTabItem>
    <NavMenuTabItem tabName={ContentTabEnum.Guide} label={$translate('page.passage.nav.guide.value')}>
        <CompassIcon />
    </NavMenuTabItem>
    {#if resourceData?.additionalResourceInfo?.length}
        <NavMenuTabItem tabName={ContentTabEnum.Resources} label={$translate('page.passage.nav.resources.value')}>
            <ClipboardIcon />
        </NavMenuTabItem>
    {/if}
    {#if $isOnline}
        <NavMenuTabItem tabName={ContentTabEnum.LibraryMenu} label={$translate('page.passage.nav.library.value')}>
            <LibraryIcon />
        </NavMenuTabItem>
    {/if}
    <NavMenuTabItem tabName={ContentTabEnum.MainMenu} label={$translate('page.passage.nav.menu.value')}>
        <MenuIcon />
    </NavMenuTabItem>
</div>

<div id="passage-page" class="h-full w-full">
    {#await baseFetchPromise}
        <FullPageSpinner />
    {:then}
        {#if [ContentTabEnum.Bible, ContentTabEnum.Guide, ContentTabEnum.Resources].includes($currentTab) && !$isShowingContextualMenu}
            <TopNavBar
                bind:preferredBiblesModalOpen
                bind:alignmentModeEnabled
                {bookCodesToNames}
                {currentBibleId}
                bibles={bibleData?.availableBibles ?? []}
            />
        {/if}
        <div
            class="absolute left-0 right-0 top-16 flex flex-col {!isShowingBibleOrGuide && 'hidden'} {audioPlayerShowing
                ? 'bottom-[8.5rem]'
                : 'bottom-20'}"
        >
            {#if currentBibleId !== -1 && (bibleData?.biblesForTabs.length ?? 0) > 1}
                <div class="px-4 pb-4 {$currentTab !== ContentTabEnum.Bible && 'hidden'}">
                    <div class="m-auto max-w-[65ch]">
                        <ButtonCarousel
                            bind:selectedValue={currentBibleId}
                            bind:scroll={bibleSelectionScroll}
                            buttons={(bibleData?.biblesForTabs ?? []).map((bible) => ({
                                value: bible.id,
                                label: bible.abbreviation,
                            }))}
                        />
                    </div>
                </div>
            {/if}
            <div class="flex flex-grow flex-col overflow-y-hidden {$currentTab !== ContentTabEnum.Bible && 'hidden'}">
                {#key $currentBibleSection}
                    <BibleViewer bind:preferredBiblesModalOpen {currentBibleId} {bibleData} bind:alignmentModeEnabled />
                {/key}
            </div>
            {#await resourceFetchPromise}
                {#if $currentTab === ContentTabEnum.Guide}
                    <FullPageSpinner />
                {/if}
            {:then}
                <GuideContent
                    bind:multiClipAudioStates
                    bind:audioPlayerKey
                    guideResourceInfo={resourceData?.guideResourceInfo}
                    isShowing={$currentTab === ContentTabEnum.Guide}
                />
            {/await}
        </div>
        {#if objectKeys(multiClipAudioStates).length}
            <div
                class="fixed bottom-20 left-0 right-0 z-10 m-auto flex h-14 max-w-[65ch] justify-items-center bg-base-100 px-4 {(!audioPlayerShowing ||
                    !isShowingBibleOrGuide) &&
                    'hidden'}"
            >
                <AudioPlayer {multiClipAudioStates} currentClipKey={audioPlayerKey} />
            </div>
        {/if}
    {:catch}
        <ErrorMessage />
    {/await}
    {#if $currentTab === ContentTabEnum.MainMenu}
        <MainMenu />
    {/if}
    {#if $currentTab === ContentTabEnum.Guide && $isShowingContextualMenu}
        <GuideMenu />
    {/if}
    {#if $currentTab === ContentTabEnum.Bible && $isShowingContextualMenu}
        <BibleMenu />
    {/if}
    {#key $currentBibleSection}
        <LibraryResourceMenu
            tab={ContentTabEnum.Resources}
            bind:fullscreenTextResourceStacksByTab
            resources={resourceData?.additionalResourceInfo}
            isFullLibrary={false}
            isShowing={$currentTab === ContentTabEnum.Resources}
            {bookCodesToNames}
        />
    {/key}
    <LibraryResourceMenu
        tab={ContentTabEnum.LibraryMenu}
        bind:fullscreenTextResourceStacksByTab
        resources={undefined}
        isFullLibrary={true}
        isShowing={$currentTab === ContentTabEnum.LibraryMenu}
        {bookCodesToNames}
    />
</div>
