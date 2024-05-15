<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { selectedBookIndex, selectedBibleSection } from '$lib/stores/passage-form.store';
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { passagesByBookAvailableForGuide } from '$lib/utils/data-handlers/resources/guides';
    import { bibleSectionToReference } from '$lib/utils/bible-section-helpers';
    import type { BibleSection } from '$lib/types/bible';
    import { closeAllPassagePageMenus } from '$lib/stores/passage-page.store';
    import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte';
    import { getBibleBookCodesToName } from '$lib/utils/data-handlers/bible';
    import { currentGuide } from '$lib/stores/parent-resource.store';
    import type { ApiParentResource } from '$lib/types/resource';
    import type { BasePassagesByBook } from '$lib/types/passage';
    import { isOnline } from '$lib/stores/is-online.store';

    export let bookPassageSelectorPane: CupertinoPane;
    export let isShowing: boolean;
    let steps = {
        one: { title: $translate('page.BookPassageSelectorMenu.stepOneTitle.value') },
        two: { title: $translate('page.BookPassageSelectorMenu.stepTwoTitle.value') },
    };
    let currentStep = steps.one;
    let availablePassagesByBook: BasePassagesByBook[] | null = null;

    $: selectedBookInfo = $selectedBookIndex === 'default' ? null : availablePassagesByBook?.[$selectedBookIndex];

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

    $: availablePassagesPromise = fetchAvailablePassages($currentGuide, $isOnline);

    async function fetchAvailablePassages(guide: ApiParentResource | undefined, _online: boolean) {
        if (guide) {
            availablePassagesByBook = await passagesByBookAvailableForGuide(guide.shortName);
        } else {
            availablePassagesByBook = null;
        }
    }

    function handleBack() {
        currentStep = steps.one;
    }

    onMount(async () => {
        bookPassageSelectorPane = new CupertinoPane('#book-passage-selector-pane', {
            backdrop: true,
            simulateTouch: false, // prevent weirdness when using mouse
            topperOverflow: true,
            initialBreak: 'top',
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });
        bookCodesToNames = await getBibleBookCodesToName();
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
            {#await availablePassagesPromise}
                <p>{$translate('page.BookPassageSelectorMenu.loading.value')}</p>
            {:then}
                {#if steps.one === currentStep && availablePassagesByBook}
                    {#each availablePassagesByBook as book, index}
                        <button
                            on:click={() => setBookAndChangeSteps(index)}
                            class="my-2 flex w-11/12 flex-wrap rounded-xl border p-4"
                        >
                            <span class="text-sm">{bookCodesToNames?.[book.bookCode] ?? ''}</span>
                        </button>
                    {:else}
                        <h3 class="my-2 font-bold">{$translate('page.BookPassageSelectorMenu.noBooks.value')}</h3>
                    {/each}
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
