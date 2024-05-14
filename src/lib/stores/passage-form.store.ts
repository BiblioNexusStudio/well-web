import { writable } from 'svelte/store';
import type { BasePassagesByBook } from '$lib/types/passage';
import type { BibleSection } from '$lib/types/bible';

export const selectedBibleSection = writable<BibleSection | null>(null);
export const selectedBookIndex = writable<number | 'default'>('default');
export const data = writable({} as { passagesByBook?: BasePassagesByBook[] });
