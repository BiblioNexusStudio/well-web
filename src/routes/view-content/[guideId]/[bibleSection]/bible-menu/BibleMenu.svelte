<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { lookupLanguageInfoById } from '$lib/stores/language.store';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
    import { isOnline } from '$lib/stores/is-online.store';
    import { availableBibles } from '$lib/utils/data-handlers/bible';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import SwishHeader from '$lib/components/SwishHeader.svelte';
    import { PredeterminedPassageGuides } from '$lib/types/resource';
    import { getContentContext } from '../context';
    import Spinner from '$lib/components/Spinner.svelte';
    import { needsLicenseAccepted } from '$lib/utils/bible-license-handler';
    import { Icon } from 'svelte-awesome';
    import { warning } from 'svelte-awesome/icons';
    import LicenseAcceptanceModal from './LicenseAcceptanceModal.svelte';
    import type { BaseBible } from '$lib/types/bible';
    import { sortAndFilterBibles } from '$lib/utils/bible-section-helpers';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import MenuButton from '../MenuButton.svelte';

    const { currentGuide, isLoadingToOpenPane, openBookChapterSelectorPane, openPredeterminedPassageSelectorPane } =
        getContentContext();

    $: availableBiblesPromise = availableBibles($isOnline);

    let bibleForAcceptanceModal: BaseBible | null = null;

    function openBookChapterVerseMenu() {
        const guide = $currentGuide;
        if (guide && PredeterminedPassageGuides.includes(guide.id)) {
            openPredeterminedPassageSelectorPane(guide, false);
        } else {
            openBookChapterSelectorPane(guide);
        }
    }

    function updatePreferredBibleIds(id: number, isChecked: boolean) {
        preferredBibleIds.update((ids) => {
            if (!isChecked && !ids.includes(id)) {
                return ids.concat([id]);
            } else if (isChecked && ids.includes(id)) {
                return ids.filter((existingId) => existingId !== id);
            }
            return ids;
        });
    }
</script>

<div class="z-50 flex h-full w-full flex-col">
    <SwishHeader
        bgcolor="bg-[#6172F3]"
        title={$translate('page.bibleMenu.bible.value')}
        subtitle={$translate('page.bibleMenu.selectBible.value')}
    />
    {#await availableBiblesPromise}
        <FullPageSpinner />
    {:then bibles}
        <div class="flex w-full flex-col items-center overflow-y-scroll">
            {#each sortAndFilterBibles(bibles, $currentLanguageInfo?.id, '') as bible}
                {@const isPreferredBible = $preferredBibleIds.includes(bible.id)}
                {@const needsLicenseAccept = $needsLicenseAccepted(bible)}
                <MenuButton
                    selected={isPreferredBible}
                    disabled={needsLicenseAccept}
                    data-app-insights-event-name="bible-menu-bible-selected"
                    data-app-insights-dimensions={`bibleName,${bible.name}`}
                    onClick={() =>
                        needsLicenseAccept
                            ? (bibleForAcceptanceModal = bible)
                            : updatePreferredBibleIds(bible.id, isPreferredBible)}
                >
                    <span class={needsLicenseAccept ? 'opacity-75' : ''}>{bible.name} ({bible.abbreviation})</span>
                    <span class="mx-1 {needsLicenseAccept && 'opacity-75'}">-</span>
                    <span class="text-[#98A2B3] {needsLicenseAccept && 'opacity-75'}"
                        >{lookupLanguageInfoById(bible.languageId)?.iso6393Code}</span
                    >
                    <span class="flex-grow" />
                    {#if needsLicenseAccept}
                        <button
                            class="btn btn-link btn-xs h-2"
                            data-app-insights-event-name="bible-license-acceptance-modal-opened"
                            data-app-insights-dimensions={`bibleName,${bible.name}`}
                        >
                            <Icon data={warning} />
                        </button>
                    {/if}
                </MenuButton>
            {:else}
                <h3 class="my-2">{$translate('page.bibleMenu.noBibles.value')}</h3>
            {/each}
        </div>

        <div class="mb-24 flex flex-grow items-end px-4">
            <button
                disabled={$preferredBibleIds.length === 0 || $isLoadingToOpenPane}
                on:click={openBookChapterVerseMenu}
                class="btn btn-primary w-full"
                data-app-insights-event-name="bible-menu-go-to-passage-button-clicked"
            >
                {#if $isLoadingToOpenPane}
                    <Spinner />
                {:else}
                    {$translate('page.bibleMenu.goToPassage.value')}
                {/if}
            </button>
        </div>
    {/await}
</div>

<LicenseAcceptanceModal bind:bible={bibleForAcceptanceModal} />
