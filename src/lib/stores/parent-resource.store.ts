import { derived, writable } from 'svelte/store';
import type { ApiParentResource } from '$lib/types/resource';
import { groupBy } from '$lib/utils/array';

export const parentResources = writable<ApiParentResource[]>([]);

export const parentResourceNameToInfoMap = derived(parentResources, ($parentResources) =>
    groupBy(
        $parentResources,
        (p) => p.shortName,
        (r) => r[0]
    )
);
