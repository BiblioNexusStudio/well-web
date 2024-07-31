import { derived, writable } from 'svelte/store';
import type { ApiParentResource } from '$lib/types/resource';
import { groupBy } from '$lib/utils/array';

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
