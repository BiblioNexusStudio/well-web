<script lang="ts">
    import { settings } from '$lib/stores/settings.store';
    import { _ as translate } from 'svelte-i18n';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import { type Setting, SettingShortNameEnum } from '$lib/types/settings';

    export let close: () => void;

    function getSettingsText(setting: Setting) {
        const translateTextMap = {
            [SettingShortNameEnum.showOnlySrvResources]: $translate('page.settingsMenu.showOnlySrvResources.value'),
            [SettingShortNameEnum.showCommunityResources]: $translate(
                'page.settingsMenu.communityEditionResources.value'
            ),
            [SettingShortNameEnum.showAiResources]: $translate('page.settingsMenu.aiTranslatedResources.value'),
        };

        return translateTextMap[setting.shortName];
    }
</script>

<div class="flex h-full w-full flex-col p-4">
    <div class="flex justify-end">
        <button
            class="my-4 flex w-1/4 justify-end"
            on:click={close}
            data-app-insights-event-name="settings-menu-close-button-click"
        >
            <XMarkIcon />
        </button>
    </div>
    <h1 class="mb-6 text-2xl font-bold">{$translate('page.settingsMenu.settings.value')}</h1>
    <div class="ps-4">
        <h2 class="mb-6 text-xl font-bold">{$translate('page.settingsMenu.showResourceByCheckingMethod.value')}</h2>
        {#each $settings as setting}
            {#if setting.shortName !== SettingShortNameEnum.showOnlySrvResources}
                <div class="mb-4 flex">
                    <input type="checkbox" bind:checked={setting.value} class="checkbox-primary checkbox me-4" />
                    <h3 class="me-4 grow">{getSettingsText(setting)}</h3>
                    <img
                        class="h-[26px] w-auto object-contain"
                        src={setting.shortName === SettingShortNameEnum.showAiResources
                            ? '/Ai_150x150.png'
                            : '/Community_150x150.png'}
                        alt={setting.shortName === SettingShortNameEnum.showAiResources
                            ? 'Ai Reviewer Icon'
                            : 'Community Reviewer Icon'}
                    />
                </div>
            {/if}
        {/each}
        <h2 class="my-6 text-xl font-bold">{$translate('page.settingsMenu.showResourcesByTitle.value')}</h2>
        {#each $settings as setting}
            {#if setting.shortName === SettingShortNameEnum.showOnlySrvResources}
                <div class="mb-2 flex">
                    <input
                        type="checkbox"
                        class="toggle me-4 {setting.value
                            ? 'border-none bg-white [--tglbg:#0094c9] hover:bg-white'
                            : ''}"
                        bind:checked={setting.value}
                        data-app-insights-event-name="settings-menu-setting-toggled"
                    />
                    <h3>{getSettingsText(setting)}</h3>
                </div>
            {/if}
        {/each}
    </div>
</div>
s
