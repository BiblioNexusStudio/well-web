<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import { parentResources } from '$lib/stores/parent-resource.store';
    import type { ApiParentResource } from '$lib/types/resource';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import { getContentContext } from '../context';
    import type { ResourceContentInfo, ResourceContentInfoWithMetadata } from '$lib/types/resource';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte';

    export let resourceSearchResources: ResourceContentInfo[];
    export let searchByParentResource: (
        parentResource: ApiParentResource | null,
        offset: number | null,
        query: string
    ) => Promise<void>;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let isLoading: boolean;

    const { isResourceSearch, setIsResourceSearch } = getContentContext();

    let showParentResourceMenu = true;
    let showResourceMenu = false;
    let currentParentResource: ApiParentResource | null;
    let searchQuery = '';

    $: searchByParentResource(currentParentResource, 0, searchQuery);

    function closeParentResourceMenu() {
        setIsResourceSearch(false);
        showParentResourceMenu = false;
    }

    function closeResourcesMenu() {
        resourceSearchResources = [];
        showResourceMenu = false;
        setIsResourceSearch(false);
        searchQuery = '';
    }

    function backToParentResourceMenu() {
        searchQuery = '';
        showResourceMenu = false;
        showParentResourceMenu = true;
        resourceSearchResources = [];
    }

    async function parentResourceSearch(parentResource: ApiParentResource) {
        currentParentResource = parentResource;
        showResourceMenu = true;
        showParentResourceMenu = false;
        await searchByParentResource(parentResource, 0, searchQuery);
    }

    async function loadMoreResources() {
        if (currentParentResource) {
            await searchByParentResource(currentParentResource, resourceSearchResources.length, searchQuery);
        }
    }
</script>

{#if $isResourceSearch}
    {#if showParentResourceMenu}
        {#if isLoading}
            <div class="relative z-[40] flex flex-col">
                <div class="fixed flex h-[calc(100vh-143px)] w-full flex-col justify-center bg-white">
                    <FullPageSpinner />
                </div>
            </div>
        {:else}
            <div class="relative z-[40] flex flex-col">
                <div class="fixed top-0 h-16 w-full bg-white">
                    <div class="relative flex w-full justify-center py-4">
                        <h2>{$translate('components.search.resources.value')}</h2>
                        <button
                            on:click={closeParentResourceMenu}
                            class="absolute right-4 flex w-1/4 justify-end"
                            data-app-insights-event-name="library-resource-search-close-menu-button-clicked"
                            ><XMarkIcon /></button
                        >
                    </div>
                </div>
                <div class="fixed top-16 flex h-[calc(100vh-79px)] w-full flex-col overflow-scroll bg-white">
                    {#each $parentResources as parentResource}
                        <button
                            on:click={() => parentResourceSearch(parentResource)}
                            class="mx-4 mb-4 flex h-12 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                            data-app-insights-event-name="library-resource-search-select-parent-resource-button-clicked"
                            >{parentResource.displayName}</button
                        >
                    {/each}
                </div>
            </div>
        {/if}
    {:else if showResourceMenu}
        <div class="relative z-[40] flex flex-col">
            <div class="fixed top-0 h-28 w-full bg-white">
                <div class="relative flex w-full justify-center pb-2 pt-4">
                    <button
                        on:click={backToParentResourceMenu}
                        class="absolute left-4 flex w-1/4 justify-start"
                        data-app-insights-event-name="library-resource-search-back-to-parent-resource-button-clicked"
                        ><ChevronLeftIcon /></button
                    >
                    <h2>{currentParentResource?.displayName}</h2>
                    <button
                        on:click={closeResourcesMenu}
                        class="absolute right-4 flex w-1/4 justify-end"
                        data-app-insights-event-name="library-resource-search-close-menu-button-clicked"
                        ><XMarkIcon /></button
                    >
                </div>
                <div class="px-4">
                    <SearchInput bind:searchQuery placeholder={'Search'} />
                </div>
            </div>
            <div class="fixed top-28 flex h-[calc(100vh-193px)] w-full flex-col overflow-scroll bg-white">
                {#if isLoading}
                    <FullPageSpinner />
                {:else}
                    {#each resourceSearchResources as resourceSearchResource}
                        <button
                            on:click={() => resourceSelected(resourceSearchResource)}
                            data-app-insights-event-name="library-resource-search-select-resource-button-clicked"
                            class="mx-4 mb-4 flex h-12 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                            >{resourceSearchResource.displayName}</button
                        >
                    {/each}
                    {#if resourceSearchResources.length >= 100}
                        <button
                            class="btn btn-primary mx-auto mb-4 w-auto px-4"
                            on:click={() => {
                                searchQuery = '';
                                loadMoreResources();
                            }}
                            data-app-insights-event-name="library-resource-search-load-more-button-clicked"
                            >{$translate('components.search.loadMore.value')}</button
                        >
                    {/if}
                {/if}
            </div>
        </div>
    {/if}
{/if}
