<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import {
        resourcesMenu,
        bibleDataForResourcesMenu,
        resourcesApiModule,
        selectedBookCode,
    } from '$lib/stores/file-manager.store';
    import { onMount } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import type { Language, ResourcesMenuItem } from '$lib/types/file-manager';
    import { addFrontEndDataToResourcesMenuItems } from '$lib/utils/file-manager';
    import { resourcesByLanguageAndBookEndpoint } from '$lib/api-endpoints';
    import { parentResourcesForCurrentLanguage } from '$lib/utils/data-handlers/resources/guides';

    let resourcesMenuDiv: HTMLElement;
    let menuOpen = false;

    $: selectedResources = $resourcesMenu.filter((resources) => resources.selected);
    $: handleResourceSelected($resourcesMenu, $selectedBookCode);

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    async function handleResourceSelected(resourcesMenu: ResourcesMenuItem[], selectedBookCode: string | null) {
        if (resourcesMenu.some((resources) => resources.selected && !resources.isBible) && selectedBookCode) {
            const queryParams = resourcesMenu
                .map((resource) => {
                    if (resource.selected && !resource.isBible) {
                        return `parentResourceIds=${resource.parentResource?.id}`;
                    } else {
                        return '';
                    }
                })
                .filter((query) => query !== '');

            $resourcesApiModule = await addFrontEndDataToResourcesMenuItems(
                await fetchFromCacheOrApi(
                    ...resourcesByLanguageAndBookEndpoint($currentLanguageInfo?.id, selectedBookCode, queryParams)
                )
            );
        }
    }

    $: initializeResourceMenu($currentLanguageInfo);

    async function initializeResourceMenu(_currentLanguageInfo: Language | undefined) {
        $resourcesMenu = [
            ...$bibleDataForResourcesMenu,
            ...(await parentResourcesForCurrentLanguage()).map((pr) => ({
                name: pr.displayName,
                selected: false,
                isBible: false,
                display: true,
                parentResource: pr,
            })),
        ];
    }

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (resourcesMenuDiv && !resourcesMenuDiv.contains(event.target as Node) && menuOpen) {
                toggleMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div class="relative me-2 flex h-full w-1/2 items-center" bind:this={resourcesMenuDiv}>
    <button class="btn btn-outline btn-primary flex w-full justify-between" on:click={toggleMenu}>
        {$translate('page.fileManager.viewRow.resources.value')} ({selectedResources.length}) <Icon
            data={menuOpen ? caretUp : caretDown}
        />
    </button>
    {#if menuOpen}
        <div
            class="menu absolute left-0 top-16 z-30 rounded-md border-2 border-primary-300 bg-white shadow-lg"
            style="width: {resourcesMenuDiv.clientWidth}px;"
        >
            {#each $resourcesMenu as resource}
                {#if resource.display}
                    <label class="label mb-4 cursor-pointer justify-start">
                        <input type="checkbox" bind:checked={resource.selected} class="checkbox-primary checkbox" />
                        <span class="label-text ms-4">{resource.name}</span>
                    </label>
                {/if}
            {/each}
        </div>
    {/if}
</div>
