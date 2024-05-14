import { writable } from 'svelte/store';
import type { BaseBible } from '$lib/types/bible';

export const bibles = writable<BaseBible[]>([]);
