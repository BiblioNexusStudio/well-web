<script lang="ts">
    import { onMount } from 'svelte';
    import { mockData } from './mock-data';
    import { language } from '$lib/stores/language.store';
    import { _ as translate } from 'svelte-i18n';
    import { locale } from 'svelte-i18n';
    import Icon from 'svelte-awesome';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import chevronDown from 'svelte-awesome/icons/chevronDown';
    let data = mockData;

    let searchTerm: string = '';

    const searchByBook = () => {
        if (!searchTerm) {
            data = mockData;
            return;
        }
        data = mockData.filter((d) => d.book.toLowerCase().includes(searchTerm.toLowerCase()));
    };

    const onLanguageSelected = (e: any) => {
        $locale = e.target.value;
        $language = e.target.value;
    };

    onMount(() => {
        data = mockData.map((d) => {
            d.expanded = false;
            return d;
        });
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
            <option value="en">English</option>
            <option value="tpi">Tok Pisin</option>
        </select>
    </div>

    <div class="divider" />

    <div class="overflow-x-auto mb-20">
        <div class="form-control w-full max-w-xs mb-4 px-4 sm:px-0">
            <input
                type="text"
                bind:value={searchTerm}
                on:input={() => searchByBook()}
                placeholder={$translate('page.index.searchByBook.value')}
                class="input input-primary input-bordered w-full max-w-xs"
            />
        </div>
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
                {#each data as download}
                    <tr>
                        <td>
                            <label>
                                <input type="checkbox" class="checkbox checkbox-primary" />
                            </label>
                        </td>
                        <td>
                            <div class="flex items-center space-x-3">
                                <div>
                                    <div class="font-bold">{download.book}</div>
                                </div>
                            </div>
                        </td>
                        <td> {download.totalSize} </td>
                        {#if download.resources.length > 1}
                            <td>
                                <button
                                    class="btn btn-primary btn-sm"
                                    on:click={() => (download.expanded = !download.expanded)}
                                >
                                    <Icon
                                        class="cursor-pointer text-white"
                                        data={download.expanded ? chevronUp : chevronDown}
                                    />
                                </button>
                            </td>
                        {:else}
                            <td />
                        {/if}
                    </tr>
                    {#if download.expanded && download.resources.length > 1}
                        <tr class="bg-secondary text-neutral">
                            <td class="font-bold">{$translate('page.index.download.value')}</td>
                            <td class="font-bold">{$translate('page.index.type.value')}</td>
                            <td class="font-bold">{$translate('page.index.size.value')}</td>
                            <td />
                        </tr>
                        {#each download.resources as resource}
                            <tr class="bg-primary text-neutral">
                                <td>
                                    <label>
                                        <input
                                            type="checkbox"
                                            class="checkbox checkbox-secondary"
                                        />
                                    </label>
                                </td>
                                <td> {resource.type} </td>
                                <td> {resource.resourceSize} </td>
                                <td />
                            </tr>
                        {/each}
                    {/if}
                {/each}
            </tbody>
        </table>
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
