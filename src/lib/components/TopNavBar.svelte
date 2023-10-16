<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import close from 'svelte-awesome/icons/close';
    import HomeIcon from '$lib/icons/HomeIcon.svelte';
    import navicon from 'svelte-awesome/icons/navicon';
    import gear from 'svelte-awesome/icons/gear';
    import microphone from 'svelte-awesome/icons/microphone';
    import { closeSideMenu } from '$lib/utils/side-menu';
    import DownloadIcon from '$lib/icons/DownloadIcon.svelte';
    import { isSideMenuOpen } from '$lib/stores/top-menu.store';
    import PassageForm from '$lib/components/PassageForm.svelte';
    import AddAudioRecordingModal from './AddAudioRecordingModal.svelte';
    import { featureFlags } from '$lib/stores/feature-flags.store';
    import type { BasePassage } from '$lib/types/passage';

    export let title = '';
    export let passage: BasePassage | null = null;
    let recordingModalOpen = false;

    function handleWindowClick(event: MouseEvent) {
        const details = document.querySelector('.dropdown');
        const node = event?.target as Element;
        if ((node && !details?.contains(node)) || node.closest('ul')) {
            details?.removeAttribute('open');
        }
    }
</script>

<svelte:window on:click={handleWindowClick} />

{#if passage}
    <AddAudioRecordingModal bind:open={recordingModalOpen} {passage} />
{/if}

<div class="drawer drawer-end fixed left-0 top-0 z-20 bg-base-100">
    <input id="top-navbar-drawer" type="checkbox" class="drawer-toggle" bind:checked={$isSideMenuOpen} />
    <div class="drawer-content flex flex-col">
        <div class="navbar w-full">
            <div class="semi-bold flex-1 px-2 text-lg">{title}</div>
            {#if passage && $featureFlags.audioRecording}
                <div class="flex-none">
                    <details class="dropdown dropdown-end">
                        <summary class="btn btn-link btn-active text-primary">
                            <Icon class="h-6 w-6" data={gear} scale={2} />
                        </summary>
                        <ul
                            id="gear-dropdown"
                            class="dropdown-content menu rounded-box z-[1] w-52 bg-base-100 p-2 shadow"
                        >
                            <li>
                                <button on:click={() => (recordingModalOpen = true)}>
                                    <Icon data={microphone} />
                                    {$translate('navTop.recording.value')}...
                                </button>
                            </li>
                        </ul>
                    </details>
                </div>
            {/if}
            <div class="flex-none">
                <label for="top-navbar-drawer" class="btn btn-link btn-active text-primary">
                    <Icon class="h-6 w-6" data={navicon} scale={2} />
                </label>
            </div>
        </div>
    </div>
    <div class="drawer-side">
        <label for="top-navbar-drawer" class="drawer-overlay" />
        <div class="menu min-h-full w-80 bg-base-200 p-4 pb-16">
            <div class="w-100 flex grow flex-col">
                <div class="flex items-center justify-between">
                    <h3 class="semi-bold text-lg">{$translate('sideMenu.menu.value')}</h3>
                    <label for="top-navbar-drawer" class="btn btn-link btn-active flex px-0">
                        <Icon data={close} class="text-info" />
                    </label>
                </div>
                <PassageForm isSideMenu={true} />
                <div class="mt-auto flex flex-col">
                    <a href="/" class="semi-bold mb-6 flex text-lg text-primary" on:click={closeSideMenu}
                        ><span class="mr-2 flex items-center"><HomeIcon /></span>{$translate('sideMenu.home.value')}</a
                    >
                    <a href="/file-manager" class="semi-bold mb-6 flex text-lg text-primary" on:click={closeSideMenu}
                        ><span class="mr-2 flex items-center"><DownloadIcon /></span>{$translate(
                            'sideMenu.fileManager.value'
                        )}</a
                    >
                </div>
            </div>
        </div>
    </div>
</div>
