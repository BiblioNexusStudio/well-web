<script lang="ts">
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { isOnline } from '$lib/stores/is-online.store';
    import { ParentResourceId, MediaType } from '$lib/types/resource';
    import { filterBoolean } from '$lib/utils/array';
    import { asyncMap } from '$lib/utils/async-array';
    import {
        fetchTextResourceContentAndMetadataBatched,
        filterToAvailableAssociatedResourceContent,
        type ResourceContentInfoWithFrontendData,
    } from '$lib/utils/data-handlers/resources/resource';
    import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-parsers';
    import { _ as translate } from 'svelte-i18n';

    export let isShowing: boolean;
    export let guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined;
    export let audioPlayerKey: string | undefined;

    type IsText<T> = T & {
        mediaType: MediaType.Text;
    };

    interface ResourceContentInfoWithFrontendDataAndHtml extends ResourceContentInfoWithFrontendData {
        displayName: string | undefined;
        contentHTML: string;
    }

    let textContent: ResourceContentInfoWithFrontendDataAndHtml[] = [];
    let isLoading = false;

    $: fetchContent(guideResourceInfo);
    $: isShowing && (audioPlayerKey = undefined);

    async function fetchContent(guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined) {
        try {
            if (guideResourceInfo) {
                isLoading = true;
                textContent = await fetchText(guideResourceInfo);
            } else {
                textContent = [];
            }
        } finally {
            isLoading = false;
        }
    }

    async function fetchText(resourceContents: ResourceContentInfoWithFrontendData[]) {
        const uwTextResourceContent = resourceContents.filter(
            ({ mediaType, parentResourceId }) =>
                parentResourceId === ParentResourceId.UwTranslationNotes && mediaType === MediaType.Text
        ) as IsText<ResourceContentInfoWithFrontendData>[];

        const fetchedContentAndMetadata = await fetchTextResourceContentAndMetadataBatched(uwTextResourceContent);

        const resourcesWithHtml = filterBoolean(
            await asyncMap(fetchedContentAndMetadata, async (contentAndMetadata) => {
                const { content, metadata, ...restOfResourceInfo } = contentAndMetadata;
                if (content) {
                    const availableAssociatedResources = await filterToAvailableAssociatedResourceContent(
                        $isOnline,
                        metadata?.associatedResources
                    );
                    return {
                        ...restOfResourceInfo,
                        displayName: metadata?.displayName,
                        contentHTML: parseTiptapJsonToHtml(content.tiptap, availableAssociatedResources),
                    };
                }
            })
        );

        // sort by verse then by display name
        return resourcesWithHtml.sort((a, b) => {
            if (a.verses[0]!.chapter !== b.verses[0]!.chapter) {
                return a.verses[0]!.chapter - b.verses[0]!.chapter;
            }

            if (a.verses[0]!.verse !== b.verses[0]!.verse) {
                return a.verses[0]!.verse - b.verses[0]!.verse;
            }

            const aDisplayName = a.displayName ?? '';
            const bDisplayName = b.displayName ?? '';

            return aDisplayName.localeCompare(bDisplayName, undefined, { numeric: true });
        });
    }
</script>

{#if isLoading}
    <FullPageSpinner />
{:else}
    <div class="flex flex-grow overflow-y-hidden px-4 {!isShowing && 'hidden'}">
        <div class="prose mx-auto flex flex-grow">
            <div class="flex flex-grow flex-col overflow-y-scroll">
                {#each textContent as note, index (note.id)}
                    <div class="py-1">
                        <div class="font-bold">{note.displayName ?? ''}</div>
                        <div class="ps-2">
                            {@html note.contentHTML}
                        </div>
                        {#if index !== textContent.length - 1}
                            <hr class="my-2 w-full" />
                        {/if}
                    </div>
                {:else}
                    {$translate('page.passage.resourcePane.noResourcesFound.header.value')}
                {/each}
            </div>
        </div>
    </div>
{/if}
