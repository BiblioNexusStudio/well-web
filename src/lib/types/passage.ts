import type { MediaTypeEnum } from './resource';

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
    mediaTypeName: MediaTypeEnum;
    typeName: string;
}

export interface BasePassagesByBook {
    bookCode: string;
    passages: BasePassage[];
}

export interface FrontendPassagesByBook extends BasePassagesByBook {
    bookName: string;
    index: number;
}