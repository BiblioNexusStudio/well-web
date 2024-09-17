<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import type { BibleSection } from '$lib/types/bible';
    import type { FrontendBibleBook } from '$lib/types/bible';
    import PreferredBiblesModal from './bible-menu/PreferredBiblesModal.svelte';
    import { PredeterminedPassageGuides } from '$lib/types/resource';
    import { bibleSectionToReference, isNewTestament } from '$lib/utils/bible-section-helpers';
    import AlignmentMode from '$lib/icons/AlignmentMode.svelte';
    import { isOnline } from '$lib/stores/is-online.store';
    import { ContentTabEnum, getContentContext } from './context';
    import { currentLanguageDirection } from '$lib/stores/language.store';
    import ChatBubbleIcon from '$lib/icons/ChatBubbleIcon.svelte';
    import { getResourceFeedbackContext } from './resource-feedback-context';

    const {
        currentGuide,
        isLoadingToOpenPane,
        openPredeterminedPassageSelectorPane,
        openBookChapterSelectorPane,
        openContextualMenu,
        currentBibleSection,
        currentTab,
        currentGuideItemInfo,
    } = getContentContext();

    const { openResourceFeedbackModalForResource } = getResourceFeedbackContext();

    export let bibles: FrontendBibleBook[] = [];
    export let preferredBiblesModalOpen = false;
    export let bookCodesToNames: Map<string, string> | undefined;
    export let alignmentModeEnabled: boolean;
    export let currentBibleId: number | null;

    $: bibleSectionTitle = calculateBibleSectionTitle(bookCodesToNames, $currentBibleSection);
    $: canEnableAlignmentMode = bibleHasAlignment(currentBibleId) && isNewTestament($currentBibleSection) && $isOnline;

    $: {
        if ((!isNewTestament($currentBibleSection) || !bibleHasAlignment(currentBibleId)) && alignmentModeEnabled) {
            alignmentModeEnabled = false;
        }
    }

    function currentBible(bibleId: number | null) {
        return bibles.find((b) => b.id === bibleId);
    }

    function bibleHasAlignment(bibleId: number | null) {
        return bibleId === 1 || currentBible(bibleId)?.greekAlignment === true;
    }

    function handleWindowClick(event: MouseEvent) {
        const openDetails = document.querySelector('.dropdown[open]');
        const node = event?.target as Element;
        if (
            (node && !openDetails?.contains(node)) ||
            (openDetails?.classList.contains('autoclose') && node.closest('ul'))
        ) {
            openDetails?.removeAttribute('open');
        }
    }

    function handlePassageButton() {
        const guide = $currentGuide;
        if (guide && PredeterminedPassageGuides.includes(guide.id)) {
            openPredeterminedPassageSelectorPane(guide, true);
        } else {
            openBookChapterSelectorPane(guide);
        }
    }

    function calculateBibleSectionTitle(
        bookCodesToNames: Map<string, string> | undefined,
        bibleSection: BibleSection | null
    ) {
        if (bibleSection && bookCodesToNames) {
            return `${bookCodesToNames.get(bibleSection.bookCode) ?? ''} ${bibleSectionToReference(
                bibleSection,
                $currentLanguageDirection
            )}`;
        } else {
            return '';
        }
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="navbar flex w-full justify-between">
    {#if $currentTab === ContentTabEnum.Guide || $currentTab === ContentTabEnum.Bible || $currentTab === ContentTabEnum.Resources}
        <div class="ms-2 flex-none">
            <button
                on:click={handlePassageButton}
                class="me-2 flex h-9 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                disabled={$isLoadingToOpenPane}
                data-app-insights-event-name="top-nav-passage-button-clicked"
            >
                {bibleSectionTitle.trim() ? bibleSectionTitle : $translate('navTop.selectPassage.value')}
            </button>
            {#if $currentTab === ContentTabEnum.Bible}
                <button
                    on:click={openContextualMenu}
                    class="me-2 flex h-9 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                    data-app-insights-event-name="top-nav-open-bible-menu-button-clicked"
                >
                    {$translate('page.passage.nav.bible.value')}
                </button>
            {/if}
            {#if $currentTab === ContentTabEnum.Guide}
                <button
                    on:click={openContextualMenu}
                    class="me-2 flex h-9 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                    data-app-insights-event-name="top-nav-open-guide-menu-button-clicked"
                >
                    {$currentGuide?.shortName || $translate('navTop.selectGuide.value')}
                </button>
            {/if}
        </div>
    {/if}
    <div class="flex-grow"></div>
    {#if $currentBibleSection && canEnableAlignmentMode && $currentTab === ContentTabEnum.Bible && bibles.length}
        <div class="flex-none">
            <button
                on:click={() => (alignmentModeEnabled = !alignmentModeEnabled)}
                class="btn btn-primary {alignmentModeEnabled ? 'btn-active' : 'btn-link'}"
                data-app-insights-event-name="top-nav-alignment-mode-button-clicked"
                data-app-insights-dimensions="bible,{currentBible(currentBibleId)?.abbreviation}"
            >
                <AlignmentMode />
            </button>
        </div>
    {/if}
    {#if $currentBibleSection && $currentTab === ContentTabEnum.Bible && bibles.length}
        <div class="flex-none">
            <PreferredBiblesModal bind:open={preferredBiblesModalOpen} {bibles} />
        </div>
    {/if}
    {#if $currentGuideItemInfo}
        <button
            on:click={() => openResourceFeedbackModalForResource($currentGuideItemInfo?.id)}
            class="btn btn-link !btn-info"
        >
            <ChatBubbleIcon />
        </button>
        <div class="flex-none pe-4 text-sm">
            {$translate('page.passage.resourcePane.fullscreen.currentOfTotalLabel.value', {
                values: { current: $currentGuideItemInfo.stepIndex + 1, total: $currentGuideItemInfo.totalSteps },
            })}
        </div>
    {/if}
</div>
