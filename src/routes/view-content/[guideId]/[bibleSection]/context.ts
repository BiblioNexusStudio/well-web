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
    const isShowingContextualMenu = writable(false);
    const isLoadingToOpenPane = writable(false);

    const context = {
        currentTab: { subscribe: currentTab.subscribe },
        currentBibleSection: { subscribe: currentBibleSection.subscribe },
        currentGuide: { subscribe: currentGuide.subscribe },
        currentPane: { subscribe: currentPane.subscribe },

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
        },

        closeCurrentPane: () => currentPane.set(null),

        openContextualMenu: () => isShowingContextualMenu.set(true),
        closeContextualMenu: () => isShowingContextualMenu.set(false),

        setCurrentGuide: (guide: ApiParentResource | null) => {
            goto(`/view-content/${guide?.id ?? '-'}/${bibleSectionToString(get(context.currentBibleSection)) ?? '-'}`);
        },

        setCurrentBibleSectionAndCurrentGuide: (bibleSection: BibleSection | null, guide: ApiParentResource | null) => {
            goto(`/view-content/${guide?.id ?? '-'}/${bibleSectionToString(bibleSection) ?? '-'}`);
        },

        syncSelectedBibleSectionFromUrlParam: (param: string | undefined) => {
            if (param === undefined || param === '-') {
                currentBibleSection.set(null);
            } else {
                currentBibleSection.set(stringToBibleSection(param));
            }
        },

        syncSelectedGuideFromUrlParam: (guideResources: ApiParentResource[] | undefined, param: string | undefined) => {
            if (param === undefined || param === '-') {
                currentGuide.set(null);
            } else {
                currentGuide.set(guideResources?.find((guide) => guide.id.toString() === param) ?? null);
            }
        },
    };

    setContext(CONTEXT_KEY, context);

    return context;
}

export function getContentContext() {
    return getContext<ReturnType<typeof createContentContext>>(CONTEXT_KEY);
}
