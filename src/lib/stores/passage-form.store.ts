import { writable } from 'svelte/store';
import type { BibleSection } from '$lib/types/bible';

export const selectedBibleSection = writable<BibleSection | null>(null);
export const selectedBookIndex = writable<number | 'default'>('default');
