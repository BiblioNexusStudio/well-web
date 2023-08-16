<script lang="ts">
    import { onMount } from 'svelte';
    import { language } from '$lib/stores/language.store';
    import { _ as translate } from 'svelte-i18n';
    import { locale } from 'svelte-i18n';
    import Icon from 'svelte-awesome';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import chevronDown from 'svelte-awesome/icons/chevronDown';
    import type { PageData } from './$types';
    import { PUBLIC_AQUIFER_API_URL } from '$env/static/public';
    import infoCircle from 'svelte-awesome/icons/infoCircle';
    import refresh from 'svelte-awesome/icons/refresh';
    import type { BibleBook as BibleBookInterface } from '$lib/types/fileManager';
    import { convertToReadableSize } from '$lib/utils/fileManager';

    export let data: PageData;
    let bibleData: BibleBookInterface[] = [];
    let currentBibleBook: BibleBookInterface = {
        languageId: '',
        name: '',
        contents: [],
    };
    let loading: boolean = false;

    const addExpandedToBibleData = () => {
        bibleData.forEach((book) => {
            book.contents.forEach((content) => {
                content.expanded = false;
            });
        });
    };

    const onBibleBookSelected = (e: any) => {
        const { value } = e.target;
        const book = bibleData.find((b) => b.languageId == value);
        if (book) {
            currentBibleBook = book;
        }
    };

    const onLanguageSelected = async (e: any) => {
        $locale = e.target.value;
        $language = e.target.value;
        loading = true;

        const { id } = data.languages.find((l: any) => l.iso6393Code === $language);

        const bibleResponse = await fetch(`${PUBLIC_AQUIFER_API_URL}/bibles/language/${id}`);
        bibleData = await bibleResponse.json();
        if (bibleData.length > 0) {
            currentBibleBook = bibleData[0];
        }
        addExpandedToBibleData();
        loading = false;
    };

    onMount(async () => {
        if (data.bibles) {
            bibleData = data.bibles;
            if (bibleData.length > 0) {
                currentBibleBook = bibleData[0];
            }
            addExpandedToBibleData();
        }
    });
</script>

<div class="container mx-auto">
    <div class="flex flex-col sm:flex-row mx-2 mx-4 my-6 sm:mx-0 justify-between items-center">
        <h1 class="text-2xl mb-4 sm:mb-0 text-primary">
            {$translate('page.index.fileManager.value')}
        </h1>
        <select
            class="select select-primary w-full max-w-xs"
            on:change={onLanguageSelected}
            bind:value={$language}
        >
            <option value="" disabled selected>{$translate('page.index.language.value')}</option>
            {#each data.languages as language}
                <option value={language.iso6393Code}>{language.englishDisplay}</option>
            {/each}
        </select>
    </div>

    <div class="divider" />

    {#if bibleData?.length > 0}
        <div class="flex flex-col sm:flex-row mx-2 mx-4 my-6 sm:mx-0 justify-between items-center">
            <h2 class="text-2xl mb-4 sm:mb-0 text-primary">Choose a Book</h2>
            <select
                class="select select-primary w-full max-w-xs"
                on:change={onBibleBookSelected}
                bind:value={currentBibleBook.languageId}
            >
                <option value="" disabled selected>Please select a book</option>
                {#each bibleData as bibleBook}
                    <option value={bibleBook.languageId}>{bibleBook.name}</option>
                {/each}
            </select>
        </div>

        <div class="divider" />
    {/if}
    <div class="overflow-x-auto mb-20">
        {#if bibleData.length === 0 && $language.length > 0 && !loading}
            <div class="alert alert-info flex mt-4 px-4">
                <Icon data={infoCircle} />
                <span>Sorry, we don't have data for this language.</span>
            </div>
        {:else if loading}
            <div class="alert alert-info flex mt-4 px-4">
                <Icon data={refresh} />
                <span>Loading...</span>
            </div>
        {:else if bibleData.length === 0 && $language.length === 0 && !loading}
            <div class="alert alert-info flex mt-4 px-4">
                <Icon data={infoCircle} />
                <span>Please select a language.</span>
            </div>
        {:else if bibleData.length > 0 && currentBibleBook.contents.length > 0 && !loading}
            <table class="table">
                <!-- head -->
                <thead>
                    <tr>
                        <th>{$translate('page.index.download.value')}</th>
                        <th>{$translate('page.index.book.value')}</th>
                        <th>{$translate('page.index.size.value')}</th>
                        <th>{$translate('page.index.expand.value')}</th>
                    </tr>
                </thead>

                <tbody>
                    {#each currentBibleBook.contents as book}
                        <tr>
                            <td>
                                <label>
                                    <input type="checkbox" class="checkbox checkbox-primary" />
                                </label>
                            </td>
                            <td>
                                <div class="flex items-center space-x-3">
                                    <div>
                                        <div class="font-bold">{book.displayName}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                {convertToReadableSize(book.audioSizeKb + book.textSizeKb)}
                            </td>
                            {#if book.textSizeKb > 1 || book.audioSizeKb > 1}
                                <td>
                                    <button
                                        class="btn btn-primary btn-sm"
                                        on:click={() => (book.expanded = !book.expanded)}
                                    >
                                        <Icon
                                            class="cursor-pointer text-white"
                                            data={book.expanded ? chevronUp : chevronDown}
                                        />
                                    </button>
                                </td>
                            {:else}
                                <td />
                            {/if}
                        </tr>
                        {#if book.expanded}
                            <tr class="bg-secondary text-neutral">
                                <td class="font-bold">{$translate('page.index.download.value')}</td>
                                <td class="font-bold">{$translate('page.index.type.value')}</td>
                                <td class="font-bold">{$translate('page.index.size.value')}</td>
                                <td />
                            </tr>
                            {#if book.textUrl}
                                <tr class="bg-primary text-neutral">
                                    <td>
                                        <label>
                                            <input
                                                type="checkbox"
                                                class="checkbox checkbox-secondary"
                                            />
                                        </label>
                                    </td>
                                    <td> Text </td>
                                    <td> {convertToReadableSize(book.textSizeKb)} </td>
                                    <td />
                                </tr>
                            {/if}
                            {#if book.audioUrls.chapters.length > 0}
                                {#each book.audioUrls.chapters as audioChapter}
                                    <tr class="bg-primary text-neutral">
                                        <td>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    class="checkbox checkbox-secondary"
                                                />
                                            </label>
                                        </td>
                                        <td> Audio Chapter {audioChapter.number} </td>
                                        <td> {convertToReadableSize(audioChapter.webmSizeKb)} </td>
                                        <td />
                                    </tr>
                                {/each}
                            {/if}
                        {/if}
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
    <footer class="footer footer-center p-4 bg-base-300 text-base-content fixed bottom-0 left-0">
        <div class="container mx-auto flex justify-between">
            <div>
                <a href="/"
                    ><button class="btn btn-neutral">{$translate('page.index.back.value')}</button
                    ></a
                >
            </div>
            <div class="flex">
                <button class="btn btn-neutral">{$translate('page.index.cancel.value')}</button>
                <button class="btn btn-primary ml-4">{$translate('page.index.update.value')}</button
                >
            </div>
        </div>
    </footer>
</div>
