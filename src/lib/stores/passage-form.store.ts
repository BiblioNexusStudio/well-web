import { writable } from 'svelte/store';
import type { BibleSection } from '$lib/types/bible';

export const currentBibleSection = writable<BibleSection | null>(null);
export const selectedBookIndex = writable<number | 'default'>('default');
