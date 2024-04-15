import { writable } from 'svelte/store';
import type { BaseBible } from '$lib/types/bible-text-content';

export const bibles = writable<BaseBible[]>([]);
export const bibleSetByUser = writable<BaseBible | null>(null);
