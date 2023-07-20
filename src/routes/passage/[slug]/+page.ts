import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { storeData } from '$lib/datastore';
import { error } from '@sveltejs/kit';

export const load = (({ params }) => {
    const data = get(storeData);
    const passage = data.passages.find((x) => x.id === params.slug);

    if (passage) return passage;

    throw error(404, 'Not found');
}) satisfies PageLoad;
