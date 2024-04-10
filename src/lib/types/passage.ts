import type { MediaType } from './resource';

export enum PassagePageMenuType {
    mainMenu = 'mainMenu',
    guideMenu = 'guideMenu',
}

export interface BasePassage {
    bookCode: string;
    endChapter: number;
    endVerse: number;
    id: number;
    startChapter: number;
    startVerse: number;
}

export interface PassageWithResourceContentIds extends BasePassage {
    contents: PassageResourceContent[];
}

export interface PassageResourceContent {
    contentId: number;
    contentSize: number;
    mediaTypeName: MediaType;
    parentResourceName: string;
}

export interface FrontendPassageResourceContent extends PassageResourceContent {
    isResourceUrlCached?: boolean;
}

export interface BasePassagesByBook {
    bookCode: string;
    passages: BasePassage[];
}

export interface FrontendPassagesByBook extends BasePassagesByBook {
    bookName: string;
    index: number;
}
