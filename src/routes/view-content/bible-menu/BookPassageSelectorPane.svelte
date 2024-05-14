<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { data, selectedBookIndex, selectedBibleSection } from '$lib/stores/passage-form.store';
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { passagesByBookAvailableForGuide } from '$lib/utils/data-handlers/resources/guides';
    import { bibleSectionToReference } from '$lib/utils/bible-section-helpers';
    import type { BibleSection } from '$lib/types/bible';
    import { closeAllPassagePageMenus } from '$lib/stores/passage-page.store';
    import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte';
    import { getBibleBookCodesToName } from '$lib/utils/data-handlers/bible';
    import { currentGuide } from '$lib/stores/parent-resource.store';

    export let bookPassageSelectorPane: CupertinoPane;
    export let isShowing: boolean;
    let steps = {
        one: { title: $translate('page.BookPassageSelectorMenu.stepOneTitle.value') },
        two: { title: $translate('page.BookPassageSelectorMenu.stepTwoTitle.value') },
    };
    let currentStep = steps.one;

    $: selectedBookInfo = $selectedBookIndex === 'default' ? null : $data.passagesByBook?.[$selectedBookIndex];

    let bookCodesToNames: Record<string, string> | undefined;

    function setBookAndChangeSteps(index: number) {
        currentStep = steps.two;
        $selectedBookIndex = index;
    }

    function setPassageAndClosePane(passage: BibleSection) {
        $selectedBibleSection = passage;
        currentStep = steps.one;
        isShowing = false;
        closeAllPassagePageMenus();
    }

    async function fetchDataPromise() {
        const guide = $currentGuide?.shortName;
        if (guide) {
            const available = await passagesByBookAvailableForGuide(guide);
            bookCodesToNames = await getBibleBookCodesToName();
            data.set({ passagesByBook: available });
        }
    }

    function handleBack() {
        currentStep = steps.one;
    }

    onMount(() => {
        fetchDataPromise();
        bookPassageSelectorPane = new CupertinoPane('#book-passage-selector-pane', {
            backdrop: true,
            topperOverflow: true,
            initialBreak: 'top',
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });
    });
</script>

<div id="book-passage-selector-pane">
    <div class="flex h-[calc(100%-81px)] w-full flex-col items-center">
        {#if currentStep !== steps.one}
            <div class="flex w-full items-center justify-between">
                <button on:click={handleBack} class="mx-4 flex h-full items-center self-start">
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
            {#await fetchDataPromise}
                <p>{$translate('page.BookPassageSelectorMenu.loading.value')}</p>
            {:then}
                {#if steps.one === currentStep && $data.passagesByBook}
                    {#each $data.passagesByBook as book, index}
                        <button
                            on:click={() => setBookAndChangeSteps(index)}
                            class="my-2 flex w-11/12 flex-wrap rounded-xl border p-4"
                        >
                            <span class="text-sm">{bookCodesToNames?.[book.bookCode] ?? ''}</span>
                        </button>
                    {/each}
                    {#if $data.passagesByBook.length === 0}
                        <h3 class="my-2 font-bold">{$translate('page.BookPassageSelectorMenu.noBooks.value')}</h3>
                    {/if}
                {/if}
                {#if steps.two === currentStep}
                    {#if selectedBookInfo}
                        {#each selectedBookInfo.passages as passage}
                            <button
                                on:click={() => setPassageAndClosePane(passage)}
                                class="my-2 flex w-11/12 flex-wrap rounded-xl border p-4 text-sm"
                                >{bookCodesToNames?.[selectedBookInfo.bookCode]}
                                {bibleSectionToReference(passage)}</button
                            >
                        {/each}
                        {#if selectedBookInfo.passages.length === 0}
                            <h3 class="my-2">
                                {$translate('page.BookPassageSelectorMenu.noPassages.value')}
                            </h3>
                        {/if}
                    {/if}
                {/if}
            {/await}
        </div>
    </div>
</div>
