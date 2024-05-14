import type { BibleSection } from './bible';

export enum PassagePageMenuType {
    mainMenu = 'mainMenu',
    guideMenu = 'guideMenu',
}

export interface BasePassagesByBook {
    bookCode: string;
    passages: BibleSection[];
}
