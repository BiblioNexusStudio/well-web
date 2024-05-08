import { writable } from 'svelte/store';
import type { BibleSection, FrontendPassagesByBook } from '$lib/types/passage';

export const selectedBibleSection = writable<BibleSection | null>(null);
export const selectedBookIndex = writable<number | 'default'>('default');
export const passagesByBook = writable<FrontendPassagesByBook[]>([]);
export const data = writable({} as { passagesByBook?: FrontendPassagesByBook[] });
