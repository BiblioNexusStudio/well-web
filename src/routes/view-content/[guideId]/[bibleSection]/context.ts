import type { BibleSection } from '$lib/types/bible';
import type { ApiParentResource } from '$lib/types/resource';
import { get, writable } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import { bibleSectionToString } from '$lib/utils/bible-section-helpers';
import { goto } from '$app/navigation';
import { stringToBibleSection } from '$lib/utils/bible-section-helpers';
import {
    openBookChapterSelectorPane,
    openPredeterminedPassageSelectorPane,
    type ContentPaneInfo,
} from './bible-menu/pane-handler';

export enum ContentTabEnum {
    Bible = 'Bible',
    Guide = 'Guide',
    MainMenu = 'MainMenu',
    LibraryMenu = 'LibraryMenu',
    Resources = 'Resources',
}

const CONTEXT_KEY = 'contentContext';

export function createContentContext() {
    const currentTab = writable<ContentTabEnum>(ContentTabEnum.Bible);
    const currentBibleSection = writable<BibleSection | null>(null);
    const currentGuide = writable<ApiParentResource | null>(null);
    const currentPane = writable<ContentPaneInfo | null>(null);
    const currentStepInfo = writable<{ index: number; length: number } | null>(null);
    const isShowingContextualMenu = writable(false);
    const isLoadingToOpenPane = writable(false);
    const isPassageSearch = writable(false);
    const passageSearchBibleSection = writable<BibleSection | null>(null);

    const context = {
        isPassageSearch: { subscribe: isPassageSearch.subscribe },
        passageSearchBibleSection: { subscribe: passageSearchBibleSection.subscribe },
        currentTab: { subscribe: currentTab.subscribe },
        currentBibleSection: { subscribe: currentBibleSection.subscribe },
        currentGuide: { subscribe: currentGuide.subscribe },
        currentPane: { subscribe: currentPane.subscribe },
        currentStepInfo: { subscribe: currentStepInfo.subscribe },

        // the contextual menu is the Guide Menu or Bible Menu, depending on the current tab
        isShowingContextualMenu: { subscribe: isShowingContextualMenu.subscribe },

        // handle launching the different panes
        isLoadingToOpenPane: { subscribe: isLoadingToOpenPane.subscribe },
        openBookChapterSelectorPane: async (guide: ApiParentResource | null) => {
            isLoadingToOpenPane.set(true);
            try {
                await openBookChapterSelectorPane(currentPane.set, guide);
            } finally {
                isLoadingToOpenPane.set(false);
            }
        },
        openPredeterminedPassageSelectorPane: async (guide: ApiParentResource, showAllAvailable: boolean) => {
            isLoadingToOpenPane.set(true);
            try {
                await openPredeterminedPassageSelectorPane(
                    currentPane.set,
                    context.setCurrentGuide,
                    context.closeContextualMenu,
                    guide,
                    get(context.currentBibleSection),
                    showAllAvailable
                );
            } finally {
                isLoadingToOpenPane.set(false);
            }
        },

        setCurrentTab: (tab: ContentTabEnum) => {
            currentTab.set(tab);
            currentPane.set(null);
            if (
                (tab === ContentTabEnum.Bible && !get(context.currentBibleSection)) ||
                (tab === ContentTabEnum.Guide && !get(context.currentGuide))
            ) {
                isShowingContextualMenu.set(true);
            } else {
                isShowingContextualMenu.set(false);
            }
            if (tab === ContentTabEnum.Resources) {
                isPassageSearch.set(false);
            } else if (tab === ContentTabEnum.LibraryMenu && get(passageSearchBibleSection) !== null) {
                isPassageSearch.set(true);
            }
        },

        closeCurrentPane: () => {
            currentPane.set(null);
            if (get(passageSearchBibleSection) === null) {
                isPassageSearch.set(false);
            }
        },

        openContextualMenu: () => isShowingContextualMenu.set(true),
        closeContextualMenu: () => isShowingContextualMenu.set(false),

        setCurrentGuide: (guide: ApiParentResource | null) => {
            goto(buildContentViewerPath(guide?.id, get(context.currentBibleSection)));
        },

        setCurrentBibleSectionAndCurrentGuide: (bibleSection: BibleSection | null, guide: ApiParentResource | null) => {
            goto(buildContentViewerPath(guide?.id, bibleSection));
        },

        setCurrentStepInfo: (index: number, length: number) => {
            currentStepInfo.set({ index, length });
        },

        clearCurrentStepInfo: () => {
            currentStepInfo.set(null);
        },

        syncSelectedDataFromParams: (
            guideResources: ApiParentResource[] | undefined,
            bibleParam: string | undefined,
            guideParam: string | undefined,
            searchParams: URLSearchParams
        ) => {
            if (bibleParam === undefined || bibleParam === '-') {
                currentBibleSection.set(null);
            } else {
                currentBibleSection.set(stringToBibleSection(bibleParam));
            }

            if (guideParam === undefined || guideParam === '-') {
                currentGuide.set(null);
            } else {
                currentGuide.set(guideResources?.find((guide) => guide.id.toString() === guideParam) ?? null);
            }

            const tabParam = searchParams.get('tab');
            if (get(currentBibleSection) && tabParam) {
                context.setCurrentTab(tabParam as ContentTabEnum);
            }
        },

        setIsPassageSearch: (value: boolean) => {
            isPassageSearch.set(value);
        },
        setPassageSearchBibleSection: (value: BibleSection | null) => {
            passageSearchBibleSection.set(value);
        },
    };

    setContext(CONTEXT_KEY, context);

    return context;
}

export function buildContentViewerPath(
    guideId: number | string | undefined | null,
    bibleSection: BibleSection | string | null,
    tab?: ContentTabEnum | null
): string {
    const guidePart = guideId ?? '-';
    const bibleSectionPart =
        typeof bibleSection === 'string' ? bibleSection : bibleSectionToString(bibleSection) ?? '-';
    const tabPart = tab ? `?tab=${tab}` : '';
    return `/view-content/${guidePart}/${bibleSectionPart}${tabPart}`;
}

export function getContentContext() {
    return getContext<ReturnType<typeof createContentContext>>(CONTEXT_KEY);
}
