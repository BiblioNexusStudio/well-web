<script lang="ts">
    import { settings } from '$lib/stores/settings.store';
    import { openMainMenu } from '$lib/stores/passage-page.store';
    import { _ as translate } from 'svelte-i18n';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import { type Setting, SettingShortNameEnum } from '$lib/types/settings';

    function getSettingsText(setting: Setting) {
        const translateTextMap = {
            [SettingShortNameEnum.showOnlySrvResources]: $translate('page.settingsMenu.showOnlySrvResources.value'),
        };

        return translateTextMap[setting.shortName];
    }
</script>

<div class="flex h-full w-full flex-col p-4">
    <div class="flex justify-end">
        <button
            class="my-4 flex w-1/4 justify-end"
            on:click={openMainMenu}
            data-app-insights-event-name="settings-menu-close-button-click"
        >
            <XMarkIcon />
        </button>
    </div>
    <h1 class="mb-6 text-2xl font-bold">{$translate('page.settingsMenu.settings.value')}</h1>
    {#each $settings as setting}
        <div class="flex">
            <input
                type="checkbox"
                class="toggle me-4 {setting.value ? 'border-none bg-white [--tglbg:#0094c9] hover:bg-white' : ''}"
                bind:checked={setting.value}
                data-app-insights-event-name="settings-menu-setting-toggled"
            />
            <h2>{getSettingsText(setting)}</h2>
        </div>
    {/each}
</div>
