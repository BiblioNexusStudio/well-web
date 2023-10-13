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
    import { currentLanguageInfo } from '$lib/stores/current-language.store';
    import type { ResourcesMenuItem } from '$lib/types/file-manager';
    import { ResourceType } from '$lib/types/resource';
    import { addFrontEndDataToResourcesMenuItems } from '$lib/utils/file-manager';

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
                        return `resourceTypes=${resource.value}`;
                    } else {
                        return '';
                    }
                })
                .filter((query) => query !== '');

            $resourcesApiModule = await addFrontEndDataToResourcesMenuItems(
                await fetchFromCacheOrApi(
                    `/resources/language/${$currentLanguageInfo?.id}/book/${selectedBookCode}?${queryParams.join('&')}`
                )
            );
        }
    }

    onMount(() => {
        $resourcesMenu = [
            ...$bibleDataForResourcesMenu,
            {
                name: $translate('page.fileManager.resourcesMenu.cbbtEr.value'),
                value: ResourceType.CBBTER,
                selected: false,
                isBible: false,
                display: true,
            },
            {
                name: $translate('page.fileManager.resourcesMenu.tyndaleBibleDictionary.value'),
                value: ResourceType.TyndaleBibleDictionary,
                selected: false,
                isBible: false,
                display: true,
            },
            {
                name: $translate('page.fileManager.resourcesMenu.UbsImages.value'),
                value: ResourceType.UbsImages,
                selected: false,
                isBible: false,
                display: true,
            },
        ];

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

<div class="relative flex h-full w-1/2 items-center pr-2" bind:this={resourcesMenuDiv}>
    <button class="btn btn-primary btn-outline flex w-full justify-between" on:click={toggleMenu}>
        {$translate('page.fileManager.viewRow.resources.value')} ({selectedResources.length}) <Icon
            data={menuOpen ? caretUp : caretDown}
        />
    </button>
    {#if menuOpen}
        <div class="border-2-primary menu absolute left-0 top-16 z-30 rounded-md bg-white shadow-lg">
            {#each $resourcesMenu as resource}
                {#if resource.display}
                    <label class="label mb-4 cursor-pointer justify-start">
                        <input type="checkbox" bind:checked={resource.selected} class="checkbox-primary checkbox" />
                        <span class="label-text ml-4">{resource.name}</span>
                    </label>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style>
    .menu {
        width: calc(100vw - 2rem);
        border: 2px solid #b5ac8b;
    }
</style>
