<script lang="ts">
    import { trapFocus } from '$lib/utils/trap-focus';
    import { Icon } from 'svelte-awesome';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import type { ResourceContentInfoWithMetadata, TextResourceContentJustId } from '$lib/types/resource';
    import { _ as translate } from 'svelte-i18n';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import {
        fetchMetadataForResourceContent,
        fetchTiptapForResourceContent,
        filterToAvailableAssociatedResourceContent,
        addThumbnailToVideo,
    } from '$lib/utils/data-handlers/resources/resource';
    import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-parsers';
    import { isOnline } from '$lib/stores/is-online.store';
    import type { ContentTabEnum } from '../context';

    export let tab: ContentTabEnum;
    export let fullscreenTextResourceStacksByTab: Map<
        ContentTabEnum,
        (ResourceContentInfoWithMetadata | TextResourceContentJustId)[]
    >;

    $: fullscreenTextResourceStack = fullscreenTextResourceStacksByTab.get(tab) ?? [];
    $: currentResource = fullscreenTextResourceStack[fullscreenTextResourceStack.length - 1];
    $: textResourcePromise = currentResource && loadTextContent(currentResource);

    function goBack() {
        fullscreenTextResourceStack.pop();
        fullscreenTextResourceStack = fullscreenTextResourceStack;
    }

    async function loadTextContent(resource: ResourceContentInfoWithMetadata | TextResourceContentJustId) {
        const [tiptap, metadata] = await Promise.all([
            fetchTiptapForResourceContent(resource),
            fetchMetadataForResourceContent(resource),
        ]);
        let html: string | null = null;
        if (tiptap) {
            const availableAssociatedResources = await filterToAvailableAssociatedResourceContent(
                $isOnline,
                metadata?.associatedResources
            );

            if (tiptap.tiptap.content.some((node) => node.type === 'video')) {
                addThumbnailToVideo(tiptap);
            }

            html = parseTiptapJsonToHtml(tiptap.tiptap, tab, availableAssociatedResources);
        }
        return { html, displayName: metadata?.displayName };
    }
</script>

{#if currentResource !== undefined}
    <div use:trapFocus class="fixed inset-0 bottom-20 z-50 flex w-full flex-col bg-primary-content">
        {#await textResourcePromise}
            <FullPageSpinner />
        {:then resource}
            <div class="px-4">
                <div class="mx-auto flex w-full max-w-[65ch] flex-row items-center py-3">
                    <button
                        class="btn btn-link text-base-500"
                        on:click={goBack}
                        data-app-insights-event-name="fullscreen-close-button-clicked"
                        ><Icon data={chevronLeft} /></button
                    >
                    <div class="flex-grow px-3 text-center text-lg font-semibold text-base-content">
                        {resource?.displayName}
                    </div>
                    <!-- hack to make text centered -->
                    <div class="btn btn-link text-base-500 opacity-0"><Icon data={chevronLeft} /></div>
                </div>
            </div>
            <div class="prose mx-auto overflow-y-scroll px-4 pb-4 md:px-0">
                {#if resource?.html}
                    {@html resource.html}
                {:else}
                    {$translate('page.about.error.value')}
                {/if}
            </div>
        {/await}
    </div>
{/if}
