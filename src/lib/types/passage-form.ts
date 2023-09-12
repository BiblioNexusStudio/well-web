import type { ApiPassage } from '$lib/types/file-manager';

export interface PassagesForBook {
    displayName: string;
    passages: ApiPassage[];
}
