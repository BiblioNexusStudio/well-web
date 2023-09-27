<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { hideDownloadedBundles, changeMenuGroupValue } from '$lib/stores/file-manager.store';
    import { onMount } from 'svelte';

    let changeMenu: HTMLElement;
    let menuOpen = false;

    const changeMenuItems = [
        {
            value: 'book',
            translate: $translate('page.fileManager.changeViewMenu.book.value'),
        },
        {
            value: 'chapter',
            translate: $translate('page.fileManager.changeViewMenu.chapter.value'),
        },
        {
            value: 'pericope',
            translate: $translate('page.fileManager.changeViewMenu.pericope.value'),
        },
        {
            value: 'resource',
            translate: $translate('page.fileManager.changeViewMenu.resource.value'),
        },
    ];

    function toggleMenu() {
        menuOpen = !menuOpen;
    }

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (changeMenu && !changeMenu.contains(event.target as Node) && menuOpen) {
                toggleMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div class="flex h-full items-center relative" bind:this={changeMenu}>
    <button
        on:click={toggleMenu}
        class="btn {menuOpen
            ? 'bg-primary text-white'
            : 'text-primary bg-transparent'} no-animation lowercase shadow-none border-transparent hover:bg-transparent hover:border-0"
        >{$translate('page.fileManager.changeViewMenu.changeView.value')}</button
    >
    {#if menuOpen}
        <div class="absolute top-16 right-0 border-2-primary bg-white shadow-lg rounded-md menu z-40">
            <div class="p-1 flex flex-col">
                <h3 class="text-l font-bold mb-4">
                    {$translate('page.fileManager.changeViewMenu.downloadBundles.value')}
                </h3>
                <div class="flex pl-4">
                    <label class="label cursor-pointer mb-4">
                        <input
                            type="checkbox"
                            bind:checked={$hideDownloadedBundles}
                            class="checkbox checkbox-primary"
                        />
                        <span class="label-text ml-4"
                            >{$translate('page.fileManager.changeViewMenu.hideDownloadedBundles.value')}</span
                        >
                    </label>
                </div>
                <h3 class="text-l font-bold mb-4">{$translate('page.fileManager.changeViewMenu.bundleView.value')}</h3>
                <div class="flex flex-col pl-4 space-y-4">
                    {#each changeMenuItems as changeMenuItem}
                        <div class="form-control">
                            <label class="label justify-start cursor-pointer">
                                <input
                                    type="radio"
                                    name="change-view-menu"
                                    class="radio checked:bg-primary"
                                    value={changeMenuItem.value}
                                    bind:group={$changeMenuGroupValue}
                                    on:change={toggleMenu}
                                />
                                <span class="label-text ml-4 capitalize"> {changeMenuItem.translate}</span>
                            </label>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .menu {
        width: calc(100vw - 2rem);
        border: 2px solid #b5ac8b;
    }
</style>
