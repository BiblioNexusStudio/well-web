<script lang="ts">
    import { goto } from '$app/navigation';
    import { _ as translate } from 'svelte-i18n';
    import DownloadIcon from '$lib/icons/DownloadIcon.svelte';
    import HomeIcon from '$lib/icons/HomeIcon.svelte';
    import LanguageIcon from '$lib/icons/LanguageIcon.svelte';
    import CogIcon from '$lib/icons/CogIcon.svelte';
    import { openSettingsMenu } from '$lib/stores/passage-page.store';
</script>

<div class="z-50 flex h-full w-full flex-col">
    <div class="relative mb-6 flex h-[166px] w-full rounded-b-3xl bg-[#00A3E0] px-6 pt-12">
        <div class="absolute bottom-0 left-0 w-full">
            <img src="/menu-swish.png" alt="Menu Swish" class="h-auto w-full rounded-b-3xl" />
        </div>

        <div class="flex w-full justify-between">
            <h2 class="z-10 text-2xl font-bold text-white">{$translate('page.menu.menu.value')}</h2>
            <button on:click={openSettingsMenu} class="z-10 flex items-start">
                <CogIcon />
            </button>
        </div>
    </div>
    <div class="mb-6 flex flex-col px-6">
        <div class="flex flex-col text-[#344054]">
            <span class="mb-2 text-xs font-bold">{$translate('page.menu.language.value')}</span>
            <button
                on:click={() => goto('/select-language')}
                class="btn btn-outline btn-primary border-[#EAECF0] !text-[#344054]"
                ><LanguageIcon />{$translate('page.menu.changeLanguage.value')}</button
            >
        </div>
    </div>
    <hr class="mb-6 border-[#EAECF0]" />
    <div class="mb-6 flex flex-col px-6">
        <div class="flex flex-col">
            <span class="mb-2 text-xs font-bold text-[#344054]">{$translate('page.menu.shortcuts.value')}</span>
            <div class="grid grid-cols-2 gap-4">
                <button
                    on:click={() => goto('/')}
                    class="btn btn-outline btn-primary flex h-auto flex-col items-start border-[#EAECF0] p-4 !text-[#344054]"
                    ><HomeIcon /><span class="mt-2 text-xs">{$translate('page.menu.home.value')}</span></button
                >

                <button
                    on:click={() => goto('/file-manager')}
                    class="btn btn-outline btn-primary flex h-auto flex-col items-start border-[#EAECF0] p-4 !text-[#344054]"
                    ><DownloadIcon /><span class="mt-2 text-xs">{$translate('page.menu.downloadManager.value')}</span
                    ></button
                >
            </div>
        </div>
    </div>
</div>
