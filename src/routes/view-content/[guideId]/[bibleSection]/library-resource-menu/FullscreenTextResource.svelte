<script lang="ts">
    import { trapFocus } from '$lib/utils/trap-focus';
    import { Icon } from 'svelte-awesome';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import { MediaType, type BasicTextResourceContent, ReviewLevel } from '$lib/types/resource';
    import { _ as translate } from 'svelte-i18n';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import {
        fetchMetadataForResourceContent,
        fetchTiptapForResourceContent,
        filterToAvailableAssociatedResourceContent,
        addThumbnailToVideo,
        resourceContentApiFullUrl,
    } from '$lib/utils/data-handlers/resources/resource';
    import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-parsers';
    import { isOnline } from '$lib/stores/is-online.store';
    import type { ContentTabEnum } from '../context';
    import { currentLanguageDirection } from '$lib/stores/language.store';
    import { handleRtlVerseReferences } from '$lib/utils/language-utils';
    import AudioPlayer from '$lib/components/AudioPlayer.svelte';
    import { audioFileTypeForBrowser } from '$lib/utils/browser';
    import { getResourceFeedbackContext } from '../resource-feedback-context';
    import ChatBubbleIcon from '$lib/icons/ChatBubbleIcon.svelte';
    import GlobeIcon from '$lib/icons/GlobeIcon.svelte';
    import { isShowingCommunityEditionModal } from '$lib/stores/community-edition-modal.store';
    import { log } from '$lib/logger';

    export let tab: ContentTabEnum;
    export let fullscreenTextResourceStacksByTab: Map<ContentTabEnum, BasicTextResourceContent[]>;

    const { openResourceFeedbackModalForResource } = getResourceFeedbackContext();

    let previousStackLength = 0;
    let stackSizeJustExpanded = false;
    $: fullscreenTextResourceStack = fullscreenTextResourceStacksByTab.get(tab) ?? [];

    $: if (fullscreenTextResourceStack.length !== previousStackLength) {
        stackSizeJustExpanded = fullscreenTextResourceStack.length > previousStackLength;
        previousStackLength = fullscreenTextResourceStack.length;
    }

    $: currentResource = fullscreenTextResourceStack[fullscreenTextResourceStack.length - 1];
    $: textResourcePromise = currentResource && loadTextContent(currentResource);

    function goBack() {
        fullscreenTextResourceStack.pop();
        fullscreenTextResourceStack = fullscreenTextResourceStack;
    }

    async function loadTextContent(resource: BasicTextResourceContent) {
        const [tiptap, metadata] = await Promise.all([
            fetchTiptapForResourceContent(resource),
            fetchMetadataForResourceContent(resource),
        ]);
        if (stackSizeJustExpanded && resource.version === -1) {
            log.trackEvent(
                'resource-link-clicked',
                `resourceContentId,${resource.id},resourceName,${metadata?.displayName}`
            );
        }
        let html: string | null = null;
        if (tiptap) {
            const availableAssociatedResources = await filterToAvailableAssociatedResourceContent(
                $isOnline,
                metadata?.associatedResources
            );

            if (tiptap.tiptap.content.some((node) => node.type === 'video')) {
                addThumbnailToVideo(tiptap);
            }

            html = parseTiptapJsonToHtml(tiptap.tiptap, $currentLanguageDirection, tab, availableAssociatedResources);
        }
        return {
            html,
            audioUrl: resource.audioId
                ? resourceContentApiFullUrl({
                      mediaType: MediaType.Audio,
                      id: resource.audioId,
                      version: resource.audioVersion,
                  })
                : null,
            displayName: handleRtlVerseReferences(metadata?.displayName, $currentLanguageDirection),
            communityEdition: metadata?.reviewLevel === ReviewLevel.Community,
        };
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
                    <button
                        on:click={() => openResourceFeedbackModalForResource(currentResource?.id)}
                        class="btn btn-link !btn-info"
                    >
                        <ChatBubbleIcon />
                    </button>
                </div>
            </div>
            <div class="self-center overflow-y-scroll">
                {#if resource?.communityEdition}
                    <div class="float-end p-4 pe-5 text-warning">
                        <button on:click={() => ($isShowingCommunityEditionModal = true)}>
                            <GlobeIcon />
                        </button>
                    </div>
                {/if}
                <div
                    class="prose mx-2 rounded-md {resource?.communityEdition &&
                        'bg-warning-content'} px-4 pb-4 pt-2 {resource?.audioUrl ? 'mb-16' : 'mb-2'}"
                >
                    {#if resource?.html}
                        {@html resource.html}
                    {:else}
                        {$translate('page.passage.resourcePane.error.value')}
                    {/if}
                </div>
            </div>
            {#if resource?.audioUrl}
                <div
                    class="fixed bottom-20 left-0 right-0 z-10 m-auto flex h-14 max-w-[65ch] justify-items-center bg-base-100 px-4"
                >
                    <AudioPlayer files={[{ url: resource.audioUrl, type: audioFileTypeForBrowser(), startTime: 0 }]} />
                </div>
            {/if}
        {/await}
    </div>
{/if}
