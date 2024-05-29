<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
    import gear from 'svelte-awesome/icons/gear';
    import plus from 'svelte-awesome/icons/plus';
    import microphone from 'svelte-awesome/icons/microphone';
    import AddAudioRecordingModal from './AddAudioRecordingModal.svelte';
    import { featureFlags } from '$lib/stores/feature-flags.store';
    import type { BibleSection } from '$lib/types/bible';
    import type { FrontendBibleBook } from '$lib/types/bible';
    import PreferredBiblesModal from './PreferredBiblesModal.svelte';
    import { PassagePageTabEnum } from '../../routes/view-content/data-fetchers';
    import { openGuideMenu, openBibleMenu } from '$lib/stores/passage-page.store';
    import { PredeterminedPassageGuides } from '$lib/types/resource';
    import { currentGuide } from '$lib/stores/parent-resource.store';

    export let bibleSectionTitle = '';
    export let bibleSection: BibleSection | null = null;
    export let bibles: FrontendBibleBook[] = [];
    let recordingModalOpen = false;
    export let preferredBiblesModalOpen = false;
    export let tab: PassagePageTabEnum | null = null;
    export let guideShortName = '';
    export let showBookChapterVerseMenu: boolean;
    export let showBookPassageSelectorPane: boolean;

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

    function handlePassageButton() {
        if (tab === PassagePageTabEnum.Bible) {
            showBookChapterVerseMenu = true;
        } else if (tab === PassagePageTabEnum.Guide || tab === PassagePageTabEnum.Resources) {
            const currentGuideId = $currentGuide?.id;
            if (currentGuideId && PredeterminedPassageGuides.includes(currentGuideId)) {
                showBookPassageSelectorPane = true;
            } else {
                showBookChapterVerseMenu = true;
            }
        }
    }
</script>

<svelte:window on:click={handleWindowClick} />

{#if bibleSection}
    <AddAudioRecordingModal bind:open={recordingModalOpen} {bibleSection} />
{/if}
<div class="navbar flex w-full justify-between">
    {#if tab === PassagePageTabEnum.Guide || tab === PassagePageTabEnum.Bible || tab === PassagePageTabEnum.Resources}
        <div class="ms-2 flex-none">
            <button
                on:click={handlePassageButton}
                class="me-2 flex h-9 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                data-app-insights-event-name="top-nav-passage-button-clicked"
            >
                {bibleSectionTitle.trim() ? bibleSectionTitle : $translate('navTop.selectPassage.value')}
            </button>
            {#if tab === PassagePageTabEnum.Bible}
                <button
                    on:click={openBibleMenu}
                    class="me-2 flex h-9 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                    data-app-insights-event-name="top-nav-open-bible-menu-button-clicked"
                >
                    {$translate('page.passage.nav.bible.value')}
                </button>
            {/if}
            {#if tab === PassagePageTabEnum.Guide}
                <button
                    on:click={openGuideMenu}
                    class="me-2 flex h-9 items-center justify-center rounded-lg border border-[#EAECF0] p-2 text-sm"
                    data-app-insights-event-name="top-nav-open-guide-menu-button-clicked"
                >
                    {guideShortName || $translate('navTop.selectGuide.value')}
                </button>
            {/if}
        </div>
    {/if}
    {#if bibleSection && tab === PassagePageTabEnum.Bible && bibles.length}
        <div class="flex-none">
            <details
                bind:open={preferredBiblesModalOpen}
                class="dropdown md:dropdown-end"
                data-app-insights-event-name="top-nav-preferred-bibles-modal-button-clicked"
            >
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
    {#if bibleSection && $featureFlags.audioRecording && tab !== PassagePageTabEnum.Guide}
        <div class="flex-none">
            <details class="autoclose dropdown dropdown-end">
                <summary class="btn btn-link btn-active text-primary">
                    <Icon class="h-6 w-6" data={gear} scale={2} />
                </summary>
                <ul class="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow">
                    <li>
                        <button
                            on:click={() => (recordingModalOpen = true)}
                            data-app-insights-event-name="top-nav-record-button-clicked"
                        >
                            <Icon data={microphone} />
                            {$translate('navTop.recording.value')}...
                        </button>
                    </li>
                </ul>
            </details>
        </div>
    {/if}
</div>
