<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import { resourcesMenu } from '$lib/stores/file-manager.store';
    import { onMount } from 'svelte';

    let resourcesMenuDiv: HTMLElement;
    let menuOpen = false;

    $: selectedResources = $resourcesMenu.filter((resources) => resources.selected);

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

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

<div class="flex h-full items-center relative w-1/2" bind:this={resourcesMenuDiv}>
    <button class="btn btn-primary btn-outline flex justify-between w-full mr-2" on:click={toggleMenu}>
        Resources ({selectedResources.length}) <Icon data={menuOpen ? caretUp : caretDown} />
    </button>
    {#if menuOpen}
        <div class="absolute top-16 left-0 border-2-primary bg-white shadow-lg rounded-md menu z-30">
            <!--svelte each-->
            {#each $resourcesMenu as resource}
                <label class="label cursor-pointer mb-4 justify-start">
                    <input type="checkbox" bind:checked={resource.selected} class="checkbox checkbox-primary" />
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
