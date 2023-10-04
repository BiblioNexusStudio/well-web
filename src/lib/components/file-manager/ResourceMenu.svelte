<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import { resourcesMenu, bibleDataForResourcesMenu } from '$lib/stores/file-manager.store';
    import { onMount } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import { currentLanguageInfo } from '$lib/stores/current-language.store';

    let resourcesMenuDiv: HTMLElement;
    let menuOpen = false;

    $: selectedResources = $resourcesMenu.filter((resources) => resources.selected);

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    async function handleResourceSelected(value: string) {
        // todo make a switch here that will fetch the resource based on the value
        // and take action based on what type of resource it is.

        let tempVar = await fetchFromCacheOrApi(`/passages/language/${$currentLanguageInfo?.id}/resource/${value}`);

        console.log('carlos tempVar', tempVar);
    }

    onMount(() => {
        $resourcesMenu = [
            ...$bibleDataForResourcesMenu,
            {
                name: $translate('page.fileManager.resourcesMenu.cbbtEr.value'),
                value: 'CBBTER',
                selected: false,
            },
            {
                name: $translate('page.fileManager.resourcesMenu.tyndaleBibleDictionary.value'),
                value: 'TyndaleBibleDictionary',
                selected: false,
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

<div class="flex h-full items-center relative w-1/2 pr-2" bind:this={resourcesMenuDiv}>
    <button class="btn btn-primary btn-outline flex justify-between w-full" on:click={toggleMenu}>
        {$translate('page.fileManager.viewRow.resources.value')} ({selectedResources.length}) <Icon
            data={menuOpen ? caretUp : caretDown}
        />
    </button>
    {#if menuOpen}
        <div class="absolute top-16 left-0 border-2-primary bg-white shadow-lg rounded-md menu z-30">
            <!--svelte each-->
            {#each $resourcesMenu as resource}
                <label class="label cursor-pointer mb-4 justify-start">
                    <input
                        type="checkbox"
                        bind:checked={resource.selected}
                        on:click={() => handleResourceSelected(resource.value)}
                        class="checkbox checkbox-primary"
                    />
                    <span class="label-text ml-4">{resource.name}</span>
                </label>
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
