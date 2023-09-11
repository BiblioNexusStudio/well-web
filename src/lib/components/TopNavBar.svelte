<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import close from 'svelte-awesome/icons/close';
    import navicon from 'svelte-awesome/icons/navicon';
    import { topMenuTitle } from '$lib/stores/top-menu.store';
    import PassageForm from '$lib/components/PassageForm.svelte';
</script>

<div class="drawer drawer-end fixed top-0 left-0 bg-base-100 z-10">
    <input id="top-navbar-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
        <!-- Navbar -->
        <div class="w-full navbar">
            <div class="flex-1 px-2 mx-2 text-lg semi-bold">{$topMenuTitle}</div>
            <div class="flex-none">
                <label for="top-navbar-drawer" class="btn btn-square btn-ghost text-primary">
                    <Icon data={navicon} scale={2} />
                </label>
            </div>
        </div>
    </div>
    <div class="drawer-side">
        <label for="top-navbar-drawer" class="drawer-overlay" />
        <div class="menu p-4 w-80 min-h-full bg-base-200">
            <div class="flex flex-col w-100">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg semi-bold">{$translate('sideMenu.menu.value')}</h3>
                    <label for="top-navbar-drawer" class="btn btn-square btn-ghost flex px-0 justify-end">
                        <Icon data={close} class="text-info" />
                    </label>
                </div>
                <PassageForm isSideMenu={true} />
            </div>
        </div>
    </div>
</div>
