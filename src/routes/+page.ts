import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { storeData } from '$lib/datastore';

export const load = (({ params }) => {
    return get(storeData);
}) satisfies PageLoad;
