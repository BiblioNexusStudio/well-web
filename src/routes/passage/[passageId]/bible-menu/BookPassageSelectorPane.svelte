<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { data, selectedBookIndex, selectedId } from '$lib/stores/passage-form.store';
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';
    import { isOnline } from '$lib/stores/is-online.store';
    import { fetchCbbterPassagesByBook } from '$lib/utils/data-handlers/resources/passages';
    import { passageToReference } from '$lib/utils/passage-helpers';
    import { goto } from '$app/navigation';
    import type { BasePassage, BasePassagesByBook } from '$lib/types/passage';

    export let bookPassageSelectorPane: CupertinoPane;
    export let isShowing: boolean;
    let steps = {
        one: { title: $translate('page.BookPassageSelectorMenu.stepOneTitle.value') },
        two: { title: $translate('page.BookPassageSelectorMenu.stepTwoTitle.value') },
    };
    let currentStep = steps.one;

    $: selectedBookInfo = $selectedBookIndex === 'default' ? null : $data.passagesByBook?.[$selectedBookIndex];

    function setBookAndChangeSteps(book: BasePassagesByBook, index: number) {
        currentStep = steps.two;
        $selectedBookIndex = index;
    }

    function setPassageAndClosePane(passage: BasePassage) {
        $selectedId = passage.id.toString();
        goto(`/passage/${$selectedId}`);
        currentStep = steps.one;
        isShowing = false;
    }

    async function fetchDataPromise() {
        await fetchCbbterPassagesByBook($isOnline);
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
    <div class="flex w-full flex-col items-center">
        <h3 class="my-2 font-bold">{currentStep.title}</h3>
        <hr class="my-2 w-full" />
        <div class="flex w-full flex-col items-center overflow-y-auto">
            {#await fetchDataPromise}
                <p>{$translate('page.BookPassageSelectorMenu.loading.value')}</p>
            {:then}
                {#if steps.one === currentStep && $data.passagesByBook}
                    {#each $data.passagesByBook as book, index}
                        <button
                            on:click={() => setBookAndChangeSteps(book, index)}
                            class="my-2 flex w-11/12 flex-wrap rounded-xl border p-4"
                        >
                            <span class="text-sm">{book.bookName}</span>
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
                                class="my-2 flex w-11/12 flex-wrap rounded-xl border p-4"
                                >{selectedBookInfo.bookName}
                                {passageToReference(passage)}</button
                            >
                        {/each}
                        {#if selectedBookInfo.passages.length === 0}
                            <h3 class="my-2 font-bold">
                                {$translate('page.BookPassageSelectorMenu.noPassages.value')}
                            </h3>
                        {/if}
                    {/if}
                {/if}
            {/await}
        </div>
    </div>
</div>
