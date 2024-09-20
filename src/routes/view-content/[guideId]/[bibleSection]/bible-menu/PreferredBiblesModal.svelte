<script lang="ts">
    import type { FrontendBibleBook, FrontendBibleBookWithLanguageCode } from '$lib/types/bible';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import { needsLicenseAccepted } from '$lib/utils/bible-license-handler';
    import LicenseAcceptanceModal from './LicenseAcceptanceModal.svelte';
    import type { BaseBible } from '$lib/types/bible';
    import { Icon } from 'svelte-awesome';
    import { plus, warning } from 'svelte-awesome/icons';
    import { sortAndFilterBibles } from '$lib/utils/bible-section-helpers';

    let bibleForAcceptanceModal: BaseBible | null = null;

    export let bibles: FrontendBibleBook[];
    export let open: boolean;

    let searchQuery = '';

    $: filteredBibles = sortAndFilterBibles(
        bibles,
        $currentLanguageInfo?.id,
        searchQuery
    ) as FrontendBibleBookWithLanguageCode[];
    $: currentBibleIdsInCurrentLanguage = bibles
        .filter(({ languageId, id }) => languageId === $currentLanguageInfo?.id && $preferredBibleIds.includes(id))
        .map(({ id }) => id);

    function updatePreferredBibleIds(id: number, event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked;
        preferredBibleIds.update((ids) => {
            if (checked && !ids.includes(id)) {
                return ids.concat([id]);
            } else if (!checked && ids.includes(id)) {
                return ids.filter((existingId) => existingId !== id);
            }
            return ids;
        });
    }
</script>

<details
    bind:open
    class="dropdown md:dropdown-end"
    data-app-insights-event-name="top-nav-preferred-bibles-modal-button-clicked"
>
    <summary class="btn btn-link btn-active text-primary">
        <Icon class="h-6 w-6" data={plus} scale={2} />
    </summary>
    <ul
        class="dropdown-content z-[1] max-h-[calc(100vh-15rem)] overflow-y-scroll rounded-box bg-base-100 shadow max-md:!fixed
        max-md:!inset-x-4 md:w-96"
    >
        <div class="flex flex-col space-y-2 overflow-y-scroll">
            <div class="p-2">
                <SearchInput bind:searchQuery />
            </div>
            {#each filteredBibles as bible}
                {@const needsLicenseAccept = $needsLicenseAccepted(bible)}

                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <label
                    on:click={() => needsLicenseAccept && (bibleForAcceptanceModal = bible)}
                    class="label mb-4 {needsLicenseAccept ? 'bg-gray-200' : 'cursor-pointer'} justify-start p-4"
                >
                    <input
                        type="checkbox"
                        disabled={($preferredBibleIds.includes(bible.id) &&
                            currentBibleIdsInCurrentLanguage.length === 1 &&
                            bible.defaultForCurrentLanguage) ||
                            needsLicenseAccept}
                        checked={$preferredBibleIds.includes(bible.id)}
                        on:change={(event) => updatePreferredBibleIds(bible.id, event)}
                        class="checkbox-primary checkbox"
                        data-app-insights-event-name="preferred-bible-checkbox-clicked"
                        data-app-insights-dimensions={`bible,${bible.abbreviation},bibleName,${bible.name}`}
                    />
                    <span class="label-text ms-4 {needsLicenseAccept && 'text-opacity-75'}"
                        >{bible.languageCode} - {bible.name} ({bible.abbreviation})</span
                    >
                    {#if needsLicenseAccept}
                        <button
                            class="btn btn-link btn-xs ml-2 h-2"
                            data-app-insights-event-name="bible-license-acceptance-modal-opened"
                            data-app-insights-dimensions={`bible,${bible.abbreviation},bibleName,${bible.name}`}
                        >
                            <Icon data={warning} />
                        </button>
                    {/if}
                </label>
            {/each}
        </div>
    </ul>
</details>

<LicenseAcceptanceModal bind:bible={bibleForAcceptanceModal} />
