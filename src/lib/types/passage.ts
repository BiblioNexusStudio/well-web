import type { BibleSection } from './bible';

export interface BasePassagesByBook {
    bookCode: string;
    passages: BibleSection[];
}
