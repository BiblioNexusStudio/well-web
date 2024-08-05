<script lang="ts">
    // This selector looks at all passages available for the current guide type
    // Once a passage is selected it ensures the guide gets selected, for cases where the user goes through the flow
    // of selecting a guide and then selecting a passage
    import { _ as translate } from 'svelte-i18n';
    import { selectedBookIndex } from '$lib/stores/passage-form.store';
    import { CupertinoPane } from 'cupertino-pane';
    import { onDestroy, onMount } from 'svelte';
    import { bibleSectionToReference } from '$lib/utils/bible-section-helpers';
    import type { BibleSection } from '$lib/types/bible';
    import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte';
    import type { BasePassagesByBook } from '$lib/types/passage';
    import { getContentContext } from '../context';
    import { PredeterminedPassageSelectorPaneInfo, type ContentPaneInfo } from './pane-handler';
    import { currentLanguageDirection } from '$lib/stores/language.store';

    const { currentPane, setCurrentBibleSectionAndCurrentGuide, closeContextualMenu, closeCurrentPane } =
        getContentContext();

    let pane: CupertinoPane | undefined;

    export let bookCodesToNames: Map<string, string> | undefined;

    let steps = {
        one: { title: $translate('page.PredeterminedPassageSelectorMenu.stepOneTitle.value') },
        two: { title: $translate('page.PredeterminedPassageSelectorMenu.stepTwoTitle.value') },
    };
    let currentStep = steps.one;
    let availablePassagesByBook: BasePassagesByBook[] = [];

    $: selectedBookInfo = $selectedBookIndex === 'default' ? null : availablePassagesByBook?.[$selectedBookIndex];

    $: showOrDismissPane($currentPane);

    function setBookAndChangeSteps(index: number) {
        currentStep = steps.two;
        $selectedBookIndex = index;
    }

    function showOrDismissPane(currentPane: ContentPaneInfo | null) {
        if (currentPane instanceof PredeterminedPassageSelectorPaneInfo) {
            availablePassagesByBook = currentPane.availablePassagesByBook;
            pane?.present({ animate: true });
        } else if (pane && pane.isPanePresented() && !pane.isHidden()) {
            availablePassagesByBook = [];
            pane.hide();
        }
    }

    function setPassageAndClosePane(passage: BibleSection) {
        setCurrentBibleSectionAndCurrentGuide(passage, $currentPane?.guide ?? null);
        closePane();
        closeContextualMenu();
    }

    function closePane() {
        currentStep = steps.one;
        closeCurrentPane();
    }

    function handleBack() {
        currentStep = steps.one;
    }

    onMount(async () => {
        pane = new CupertinoPane('#book-passage-selector-pane', {
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

<div id="book-passage-selector-pane">
    <div class="flex h-[calc(100%-81px)] w-full flex-col items-center">
        {#if currentStep !== steps.one}
            <div class="flex w-full items-center justify-between">
                <button
                    on:click={handleBack}
                    class="mx-4 flex h-full items-center self-start"
                    data-app-insights-event-name="book-passage-selector-pane-back-button-clicked"
                >
                    <ChevronLeftIcon />
                </button>
                <h3 class="font-bold">{currentStep.title}</h3>
                <div class="m-4"></div>
            </div>
        {:else}
            <h3 class="my-2 font-bold">{currentStep.title}</h3>
        {/if}

        <hr class="my-2 w-full" />
        <div class="flex w-full flex-col items-center overflow-y-scroll">
            {#if steps.one === currentStep && availablePassagesByBook}
                {#each availablePassagesByBook as book, index}
                    <button
                        on:click={() => setBookAndChangeSteps(index)}
                        class="my-2 flex w-11/12 flex-wrap rounded-xl border p-4"
                        data-app-insights-event-name="book-passage-selector-pane-book-selected"
                        data-app-insights-dimensions={`bookCode,${book.bookCode}`}
                    >
                        <span class="text-sm">{bookCodesToNames?.get(book.bookCode) ?? ''}</span>
                    </button>
                {:else}
                    <h3 class="my-2 font-bold">
                        {$translate('page.PredeterminedPassageSelectorMenu.noBooks.value')}
                    </h3>
                {/each}
            {/if}
            {#if steps.two === currentStep}
                {#if selectedBookInfo}
                    {#each selectedBookInfo.passages as passage}
                        <button
                            on:click={() => setPassageAndClosePane(passage)}
                            class="my-2 flex w-11/12 flex-wrap rounded-xl border p-4 text-sm"
                            data-app-insights-event-name="book-passage-selector-pane-passage-selected"
                            data-app-insights-dimensions={`passage,${bibleSectionToReference(passage, undefined)}`}
                            >{bookCodesToNames?.get(selectedBookInfo.bookCode)}
                            {bibleSectionToReference(passage, $currentLanguageDirection)}</button
                        >
                    {:else}
                        <h3 class="my-2">
                            {$translate('page.PredeterminedPassageSelectorMenu.noPassages.value')}
                        </h3>
                    {/each}
                {/if}
            {/if}
        </div>
    </div>
</div>
