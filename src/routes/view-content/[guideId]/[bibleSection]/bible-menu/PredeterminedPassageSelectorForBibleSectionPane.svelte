<script lang="ts">
    // This selector looks at the passages available for the current guide type that overlap with the current Bible section
    // Once a passage is selected it ensures the guide gets selected, for cases where the user goes through the flow
    // of selecting a guide and then selecting a passage
    import { _ as translate } from 'svelte-i18n';
    import { CupertinoPane } from 'cupertino-pane';
    import { onDestroy, onMount } from 'svelte';
    import { bibleSectionToReference } from '$lib/utils/bible-section-helpers';
    import type { BibleSection } from '$lib/types/bible';
    import { getContentContext } from '../context';
    import { PredeterminedPassageSelectorForBibleSectionPaneInfo, type ContentPaneInfo } from './pane-handler';
    import { currentLanguageDirection } from '$lib/stores/language.store';

    const { currentPane, setCurrentBibleSectionAndCurrentGuide, closeContextualMenu, closeCurrentPane } =
        getContentContext();

    let pane: CupertinoPane | undefined;

    let passagesForCurrentBibleSection: BibleSection[] = [];

    export let bookCodesToNames: Map<string, string> | undefined;

    $: showOrDismissPane($currentPane);

    function showOrDismissPane(currentPane: ContentPaneInfo | null) {
        if (currentPane instanceof PredeterminedPassageSelectorForBibleSectionPaneInfo) {
            passagesForCurrentBibleSection = currentPane.passagesForCurrentBibleSection;
            pane?.present({ animate: true });
        } else if (pane && pane.isPanePresented() && !pane.isHidden()) {
            passagesForCurrentBibleSection = [];
            pane.hide();
        }
    }

    function setPassageAndClosePane(passage: BibleSection) {
        setCurrentBibleSectionAndCurrentGuide(passage, $currentPane?.guide ?? null);
        closePane();
        closeContextualMenu();
    }

    function closePane() {
        closeCurrentPane();
    }

    onMount(async () => {
        pane = new CupertinoPane('#predetermined-passage-selector-for-bible-section-pane', {
            backdrop: true,
            simulateTouch: false, // prevent weirdness when using mouse
            topperOverflow: true,
            initialBreak: 'top',
            showDraggable: false,
            events: {
                onWillDismiss: closePane,
                onBackdropTap: closePane,
            },
        });

        try {
            pane.disableDrag();
        } catch (error) {
            // do nothing because disableDrag throws
            // an error in the console on desktop only.
            // the pane still works as expected
        }
    });

    onDestroy(() => {
        pane?.isPanePresented() && pane?.destroy();
    });
</script>

<div id="predetermined-passage-selector-for-bible-section-pane">
    <div class="flex h-[calc(100%-81px)] w-full flex-col items-center">
        <h3 class="my-2 font-bold">{$translate('page.PredeterminedPassageSelectorMenu.stepTwoTitle.value')}</h3>

        <hr class="my-2 w-full" />
        <div class="flex w-full flex-col items-center overflow-y-scroll">
            {#each passagesForCurrentBibleSection as passage}
                <button
                    on:click={() => setPassageAndClosePane(passage)}
                    class="my-2 flex w-11/12 flex-wrap rounded-xl border p-4 text-sm"
                    data-app-insights-event-name="book-passage-selector-pane-passage-selected"
                    data-app-insights-dimensions={`passage,${bibleSectionToReference(passage, undefined)}`}
                    >{bookCodesToNames?.get(passage.bookCode)}
                    {bibleSectionToReference(passage, $currentLanguageDirection)}</button
                >
            {:else}
                <h3 class="my-2">
                    {$translate('page.PredeterminedPassageSelectorMenu.noPassages.value')}
                </h3>
            {/each}
        </div>
    </div>
</div>
