<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import type { ApiParentResource } from '$lib/types/resource';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import { getContentContext } from '../context';
    import type { ResourceContentInfo, ResourceContentInfoWithMetadata } from '$lib/types/resource';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import ChevronLeftIcon from '$lib/icons/ChevronLeftIcon.svelte';
    import { afterUpdate } from 'svelte';
    import { debounce } from '$lib/utils/debounce';
    import NoResourcesFound from './NoResourcesFound.svelte';

    export let resourceSearchResources: ResourceContentInfo[];
    export let searchByParentResource: (
        parentResource: ApiParentResource | null,
        offset: number | null,
        query: string,
        loadMore?: boolean
    ) => Promise<void>;
    export let resourceSelected: (resource: ResourceContentInfoWithMetadata) => void;
    export let isLoading: boolean;
    export let hideLoadMore: boolean;
    export let parentResourceByLanguage: ApiParentResource[] = [];

    const { setIsResourceSearch } = getContentContext();

    let showParentResourceMenu = true;
    let showResourceMenu = false;
    let currentParentResource: ApiParentResource | null;
    let searchQuery = '';

    $: debouncedSearchByParentResource(searchQuery);

    const debouncedSearchByParentResource = debounce(async (query: string) => {
        searchByParentResource(currentParentResource, 0, query, false);
    }, 750);

    function closeParentResourceMenu() {
        setIsResourceSearch(false);
        showParentResourceMenu = false;
    }

    function closeResourcesMenu() {
        resourceSearchResources = [];
        showResourceMenu = false;
        setIsResourceSearch(false);
        searchQuery = '';
        hideLoadMore = false;
    }

    function backToParentResourceMenu() {
        resourceSearchResources = [];
        searchQuery = '';
        showResourceMenu = false;
        showParentResourceMenu = true;
        hideLoadMore = false;
    }

    async function parentResourceSearch(parentResource: ApiParentResource) {
        showResourceMenu = true;
        showParentResourceMenu = false;
        currentParentResource = parentResource;
        await searchByParentResource(parentResource, 0, searchQuery);
    }

    async function loadMoreResources() {
        if (currentParentResource) {
            await searchByParentResource(currentParentResource, resourceSearchResources.length, searchQuery, true);
        }
    }

    function scrollUserToNewlyAddedResources(length: number) {
        const elementId = `resource-button-${length - 99}`;
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    afterUpdate(() => {
        if (resourceSearchResources.length > 0) {
            scrollUserToNewlyAddedResources(resourceSearchResources.length);
        }
    });
</script>

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
                {#each parentResourceByLanguage as parentResource}
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
                {#each resourceSearchResources as resourceSearchResource, index}
                    <button
                        on:click={() => resourceSelected(resourceSearchResource)}
                        data-app-insights-event-name="library-resource-search-select-resource-button-clicked"
                        class="mx-4 mb-4 flex h-12 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                        id={`resource-button-${index + 1}`}>{resourceSearchResource.displayName}</button
                    >
                {:else}
                    <NoResourcesFound {searchQuery} />
                {/each}
                {#if resourceSearchResources.length >= 100 || !hideLoadMore}
                    <button
                        class="btn btn-primary mx-auto mb-4 w-auto px-4"
                        on:click={loadMoreResources}
                        data-app-insights-event-name="library-resource-search-load-more-button-clicked"
                        >{$translate('components.search.loadMore.value')}</button
                    >
                {/if}
            {/if}
        </div>
    </div>
{/if}
