import { writable, derived } from 'svelte/store';
import type { BaseBible, ApiBibleContents } from '$lib/types/bible-text-content';
import { browser } from '$app/environment';

export const bibleWellBibleSetByUser = 'BIBLE_WELL_BIBLE_SET_BY_USER';

export const bibles = writable<BaseBible[]>([]);

export const bibleStoredByUser = derived(bibles, ($bibles) => {
    const localId = browser && localStorage.getItem(bibleWellBibleSetByUser);
    return $bibles.find((b: BaseBible) => b.id.toString() === localId) || null;
});

export const bibleSetByUser = writable<BaseBible | null>(null);

export const bibleDataFetchedByUser = writable<ApiBibleContents | null>(null);

export const loadingContent = writable<boolean>(false);
