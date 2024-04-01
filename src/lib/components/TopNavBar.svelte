<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import gear from 'svelte-awesome/icons/gear';
    import plus from 'svelte-awesome/icons/plus';
    import microphone from 'svelte-awesome/icons/microphone';
    import AddAudioRecordingModal from './AddAudioRecordingModal.svelte';
    import { featureFlags } from '$lib/stores/feature-flags.store';
    import type { BasePassage } from '$lib/types/passage';
    import type { FrontendBibleBook } from '$lib/types/bible-text-content';
    import PreferredBiblesModal from './PreferredBiblesModal.svelte';
    import type { PassagePageTab } from '../../routes/passage/[passageId]/data-fetchers';

    export let title = '';
    export let passage: BasePassage | null = null;
    export let bibles: FrontendBibleBook[] = [];
    let recordingModalOpen = false;
    export let preferredBiblesModalOpen = false;
    export let tab: PassagePageTab | null = null;

    function handleWindowClick(event: MouseEvent) {
        const openDetails = document.querySelector('.dropdown[open]');
        const node = event?.target as Element;
        if (
            (node && !openDetails?.contains(node)) ||
            (openDetails?.classList.contains('autoclose') && node.closest('ul'))
        ) {
            openDetails?.removeAttribute('open');
        }
    }
</script>

<svelte:window on:click={handleWindowClick} />

{#if passage}
    <AddAudioRecordingModal bind:open={recordingModalOpen} {passage} />
{/if}
<div class="navbar w-full">
    <div class="semi-bold line-clamp-1 flex-1 break-all px-2 text-lg">{title}</div>
    {#if passage && tab === 'bible' && bibles.length}
        <div class="flex-none">
            <details bind:open={preferredBiblesModalOpen} class="dropdown md:dropdown-end">
                <summary class="btn btn-link btn-active text-primary">
                    <Icon class="h-6 w-6" data={plus} scale={2} />
                </summary>
                <ul
                    class="dropdown-content z-[1] rounded-box bg-base-100 p-2 shadow max-md:!fixed max-md:!inset-x-4 md:w-96"
                >
                    <PreferredBiblesModal {bibles} />
                </ul>
            </details>
        </div>
    {/if}
    {#if passage && $featureFlags.audioRecording}
        <div class="flex-none">
            <details class="autoclose dropdown dropdown-end">
                <summary class="btn btn-link btn-active text-primary">
                    <Icon class="h-6 w-6" data={gear} scale={2} />
                </summary>
                <ul class="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow">
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
</div>
