import type { BibleSection } from '$lib/types/bible';
import type { ApiParentResource } from '$lib/types/resource';
import { get, writable, type Readable } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import { bibleSectionToString } from '$lib/utils/bible-section-helpers';
import { goto } from '$app/navigation';
import { stringToBibleSection } from '$lib/utils/bible-section-helpers';

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

    const context = {
        currentTab: { subscribe: currentTab.subscribe } as Readable<ContentTabEnum>,
        currentBibleSection: { subscribe: currentBibleSection.subscribe } as Readable<BibleSection | null>,
        currentGuide: { subscribe: currentGuide.subscribe } as Readable<ApiParentResource | null>,
        setCurrentTab: currentTab.set,

        setCurrentBibleSection: (bibleSection: BibleSection | null) => {
            goto(`/view-content/${get(context.currentGuide)?.id ?? '-'}/${bibleSectionToString(bibleSection) ?? '-'}`);
        },

        setCurrentGuide: (guide: ApiParentResource | null) => {
            goto(`/view-content/${guide?.id ?? '-'}/${bibleSectionToString(get(context.currentBibleSection)) ?? '-'}`);
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
