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
    export let searchByParentResource: (parentResource: ApiParentResource, offset: number | null) => Promise<void>;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let isLoading: boolean;

    const { isResourceSearch, setIsResourceSearch } = getContentContext();

    let showParentResourceMenu = true;
    let showResourceMenu = false;
    let searchQuery = '';
    let currentParentResource: ApiParentResource | null;

    $: filteredResourceSearchResources = filterResourcesOnSearchInput(searchQuery, resourceSearchResources);

    function closeParentResourceMenu() {
        setIsResourceSearch(false);
        showParentResourceMenu = false;
    }

    function closeResourcesMenu() {
        resourceSearchResources = [];
        showResourceMenu = false;
        setIsResourceSearch(false);
    }

    function backToParentResourceMenu() {
        showResourceMenu = false;
        showParentResourceMenu = true;
    }

    async function parentResourceSearch(parentResource: ApiParentResource) {
        currentParentResource = parentResource;
        showParentResourceMenu = false;
        await searchByParentResource(parentResource, 0);
        showResourceMenu = true;
    }

    function filterResourcesOnSearchInput(searchQuery: string, resourceSearchResources: ResourceContentInfo[]) {
        if (searchQuery.length >= 3) {
            return resourceSearchResources.filter((resource) => {
                return resource?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
            });
        } else {
            return resourceSearchResources.length ? resourceSearchResources : [];
        }
    }

    async function loadMoreResources() {
        if (currentParentResource) {
            searchQuery = '';
            await searchByParentResource(currentParentResource, resourceSearchResources.length);
        }
    }
</script>

{#if $isResourceSearch}
    {#if isLoading}
        <div class="relative z-[40] flex flex-col">
            <div class="fixed flex h-[calc(100vh-143px)] w-full flex-col justify-center bg-white">
                <FullPageSpinner />
            </div>
        </div>
    {:else if showParentResourceMenu}
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
    {:else if resourceSearchResources.length && showResourceMenu}
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
                {#each filteredResourceSearchResources as resourceSearchResource}
                    <button
                        on:click={() => resourceSelected(resourceSearchResource)}
                        data-app-insights-event-name="library-resource-search-select-resource-button-clicked"
                        class="mx-4 mb-4 flex h-12 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                        >{resourceSearchResource.displayName}</button
                    >
                {/each}
                <button
                    class="btn btn-primary mx-auto mb-4 w-auto px-4"
                    on:click={loadMoreResources}
                    data-app-insights-event-name="library-resource-search-load-more-button-clicked"
                    >{$translate('components.search.loadMore.value')}</button
                >
            </div>
        </div>
    {/if}
{/if}
