<script lang="ts">
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { fetchFromCacheOrCdn } from '$lib/data-cache';
    import { log } from '$lib/logger';
    import { ParentResourceId, MediaType, type ResourceContentTiptap } from '$lib/types/resource';
    import { asyncMap } from '$lib/utils/async-array';
    import {
        fetchDisplayNameForResourceContent,
        resourceContentApiFullUrl,
        type ResourceContentInfoWithFrontendData,
    } from '$lib/utils/data-handlers/resources/resource';
    import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-parsers';
    import { _ as translate } from 'svelte-i18n';

    export let isShowing: boolean;
    export let guideResourceInfo: ResourceContentInfoWithFrontendData[] | undefined;

    interface ResourceContentInfoWithFrontendDataAndHtml extends ResourceContentInfoWithFrontendData {
        displayName: string | undefined;
        contentHTML: string;
    }

    let textContent: ResourceContentInfoWithFrontendDataAndHtml[] = [];
    let isLoading = false;

    $: fetchContent(guideResourceInfo);

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
        const allTextResourceContent = resourceContents.filter(
            ({ mediaType, parentResourceId }) =>
                parentResourceId === ParentResourceId.UwTranslationNotes && mediaType === MediaType.Text
        );
        const resourcesWithHtml = (
            await asyncMap(allTextResourceContent, async (resourceContent) => {
                try {
                    const [displayName, content] = await Promise.all([
                        fetchDisplayNameForResourceContent(resourceContent),
                        fetchFromCacheOrCdn<ResourceContentTiptap[]>(resourceContentApiFullUrl(resourceContent)),
                    ]);
                    if (content[0]) {
                        return {
                            ...resourceContent,
                            displayName,
                            contentHTML: parseTiptapJsonToHtml(content[0].tiptap),
                        };
                    }
                } catch (error) {
                    // stuff not cached
                    log.exception(error as Error);
                    return null;
                }
            })
        ).filter(Boolean) as ResourceContentInfoWithFrontendDataAndHtml[];

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
                        <div class="pl-2">
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
