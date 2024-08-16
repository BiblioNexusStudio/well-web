import { goto } from '$app/navigation';
import type { BibleSection } from '$lib/types/bible';
import type { ApiParentResource } from '$lib/types/resource';
import { bibleSectionToString } from '$lib/utils/bible-section-helpers';
import { buildContentViewerPath, ContentTabEnum } from './context';

export function saveContentViewerContext(
    currentGuide: ApiParentResource | null,
    currentBibleSection: BibleSection | null,
    currentTab: ContentTabEnum,
    searchParams: URLSearchParams
) {
    if (currentGuide) {
        localStorage.setItem('currentGuideId', currentGuide.id.toString());
    } else {
        localStorage.removeItem('currentGuideId');
    }
    if (currentBibleSection) {
        localStorage.setItem('currentBibleSection', bibleSectionToString(currentBibleSection) ?? '');
    } else {
        localStorage.removeItem('currentBibleSection');
    }
    localStorage.setItem(
        'currentTab',
        currentTab === ContentTabEnum.Guide ? ContentTabEnum.Guide : ContentTabEnum.Bible
    );
    // clear `tab` param
    if (searchParams.size > 0) {
        goto(`${window.location.pathname}`, { replaceState: true });
    }
}

export function clearContentViewerContext() {
    localStorage.removeItem('currentGuideId');
    localStorage.removeItem('currentBibleSection');
    localStorage.removeItem('currentTab');
}

export function hasSavedContentViewerContext() {
    return !!localStorage.getItem('currentBibleSection');
}

export function goToSavedContentViewerContext(params: Record<string, string>) {
    if (params.guideId === '-' && params.bibleSection === '-') {
        const savedGuideId = localStorage.getItem('currentGuideId');
        const savedBibleSection = localStorage.getItem('currentBibleSection');
        const savedTab = localStorage.getItem('currentTab');
        if (savedBibleSection) {
            goto(buildContentViewerPath(savedGuideId, savedBibleSection, savedTab as ContentTabEnum), {
                replaceState: true,
            });
            return true;
        }
    }
    return false;
}
