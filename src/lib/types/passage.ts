import type { ResourceContentInfo } from './resource';

export enum PassagePageMenuType {
    mainMenu = 'mainMenu',
    guideMenu = 'guideMenu',
}

export interface BibleSection {
    bookCode: string;
    endChapter: number;
    endVerse: number;
    startChapter: number;
    startVerse: number;
}

export interface BibleSectionWithResourceContents extends BibleSection {
    contents: ResourceContentInfo[];
}

export interface BasePassagesByBook {
    bookCode: string;
    passages: BibleSection[];
}

export interface FrontendPassagesByBook extends BasePassagesByBook {
    bookName: string;
    index: number;
}
