<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import plus from 'svelte-awesome/icons/plus';
    import type { BibleSection } from '$lib/types/bible';
    import type { FrontendBibleBook } from '$lib/types/bible';
    import PreferredBiblesModal from '$lib/components/PreferredBiblesModal.svelte';
    import { openGuideMenu, openBibleMenu } from '$lib/stores/passage-page.store';
    import { PredeterminedPassageGuides } from '$lib/types/resource';
    import { bibleSectionToReference, isNewTestament } from '$lib/utils/bible-section-helpers';
    import AlignmentMode from '$lib/icons/AlignmentMode.svelte';
    import { isOnline } from '$lib/stores/is-online.store';
    import { ContentTabEnum, getContentContext } from './context';

    const { currentGuide, currentBibleSection, currentTab } = getContentContext();

    export let bibles: FrontendBibleBook[] = [];
    export let preferredBiblesModalOpen = false;
    export let showBookChapterVerseMenu: boolean;
    export let showBookPassageSelectorPane: boolean;
    export let bookCodesToNames: Map<string, string> | undefined;
    export let alignmentModeEnabled: boolean;
    export let currentBibleId: number | null;

    $: bibleSectionTitle = calculateBibleSectionTitle(bookCodesToNames, $currentBibleSection);
    $: canEnableAlignmentMode = currentBibleId === 1 && isNewTestament($currentBibleSection) && $isOnline;

    $: {
        if ((!isNewTestament($currentBibleSection) || currentBibleId !== 1) && alignmentModeEnabled) {
            alignmentModeEnabled = false;
        }
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
        const currentGuideId = $currentGuide?.id;
        if (currentGuideId && PredeterminedPassageGuides.includes(currentGuideId)) {
            showBookPassageSelectorPane = true;
        } else {
            showBookChapterVerseMenu = true;
        }
    }

    function calculateBibleSectionTitle(
        bookCodesToNames: Map<string, string> | undefined,
        bibleSection: BibleSection | null
    ) {
        if (bibleSection && bookCodesToNames) {
            return `${bookCodesToNames.get(bibleSection.bookCode) ?? ''} ${bibleSectionToReference(bibleSection)}`;
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
                data-app-insights-event-name="top-nav-passage-button-clicked"
            >
                {bibleSectionTitle.trim() ? bibleSectionTitle : $translate('navTop.selectPassage.value')}
            </button>
            {#if $currentTab === ContentTabEnum.Bible}
                <button
                    on:click={openBibleMenu}
                    class="me-2 flex h-9 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                    data-app-insights-event-name="top-nav-open-bible-menu-button-clicked"
                >
                    {$translate('page.passage.nav.bible.value')}
                </button>
            {/if}
            {#if $currentTab === ContentTabEnum.Guide}
                <button
                    on:click={openGuideMenu}
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
            >
                <AlignmentMode />
            </button>
        </div>
    {/if}
    {#if $currentBibleSection && $currentTab === ContentTabEnum.Bible && bibles.length}
        <div class="flex-none">
            <details
                bind:open={preferredBiblesModalOpen}
                class="dropdown md:dropdown-end"
                data-app-insights-event-name="top-nav-preferred-bibles-modal-button-clicked"
            >
                <summary class="btn btn-link btn-active text-primary">
                    <Icon class="h-6 w-6" data={plus} scale={2} />
                </summary>
                <ul
                    class="dropdown-content z-[1] rounded-box bg-base-100 p-2 shadow max-md:!fixed max-md:!inset-x-4 md:w-96"
                >
                    <PreferredBiblesModal {bibles} />
                </ul>
            </details>
        </div>
    {/if}
</div>
