import { derived, writable } from 'svelte/store';
import type { ApiParentResource } from '$lib/types/resource';
import { groupBy } from '$lib/utils/array';
import { browser } from '$app/environment';

export const parentResources = writable<ApiParentResource[]>([]);

export const parentResourceIdToInfoMap = derived(parentResources, ($parentResources) =>
    groupBy(
        $parentResources,
        (p) => p.id,
        (r) => r[0]
    )
);

export const guideResources = derived(parentResources, ($parentResources) =>
    $parentResources.filter((r) => r.resourceType === 'Guide')
);

const bibleWellCurrentGuide = 'LOCAL_BIBLE_WELL_CURRENT_GUIDE';

export const locallyStoredGuide = derived(guideResources, ($guideResources) => {
    const localGuideId =
        browser &&
        localStorage.getItem(bibleWellCurrentGuide) &&
        parseInt(localStorage.getItem(bibleWellCurrentGuide)!);
    return $guideResources.find((r) => r.id === localGuideId);
});

export const currentGuide = writable<ApiParentResource | undefined>(undefined);

export function setCurrentGuide(guide: ApiParentResource | undefined) {
    if (guide) {
        browser && localStorage.setItem(bibleWellCurrentGuide, guide.id.toString());
        currentGuide.set(guide);
    }
}
