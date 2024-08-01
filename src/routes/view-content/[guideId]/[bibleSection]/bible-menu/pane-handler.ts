import { isOnline } from '$lib/stores/is-online.store';
import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
import type { ApiBibleBook, BibleSection } from '$lib/types/bible';
import type { BasePassagesByBook } from '$lib/types/passage';
import type { ApiParentResource } from '$lib/types/resource';
import { bibleSectionsEqual } from '$lib/utils/bible-section-helpers';
import { bibleChaptersByBookAvailable } from '$lib/utils/data-handlers/bible';
import {
    bibleChaptersByBookAvailableForGuide,
    passagesByBookAvailableForGuide,
} from '$lib/utils/data-handlers/resources/guides';
import { get } from 'svelte/store';

export class PredeterminedPassageSelectorPaneInfo {
    availablePassagesByBook: BasePassagesByBook[];
    guide: ApiParentResource;

    constructor(availablePassagesByBook: BasePassagesByBook[], guide: ApiParentResource) {
        this.availablePassagesByBook = availablePassagesByBook;
        this.guide = guide;
    }
}

export class PredeterminedPassageSelectorForBibleSectionPaneInfo {
    passagesForCurrentBibleSection: BibleSection[];
    guide: ApiParentResource;

    constructor(passagesForCurrentBibleSection: BibleSection[], guide: ApiParentResource) {
        this.passagesForCurrentBibleSection = passagesForCurrentBibleSection;
        this.guide = guide;
    }
}

export class BookChapterSelectorPaneInfo {
    availableBooks: ApiBibleBook[];
    guide: ApiParentResource | null;

    constructor(availableBooks: ApiBibleBook[], guide: ApiParentResource | null) {
        this.availableBooks = availableBooks;
        this.guide = guide;
    }
}

export type ContentPaneInfo =
    | PredeterminedPassageSelectorPaneInfo
    | PredeterminedPassageSelectorForBibleSectionPaneInfo
    | BookChapterSelectorPaneInfo;

export async function openBookChapterSelectorPane(
    setCurrentPane: (currentPane: ContentPaneInfo) => void,
    guide: ApiParentResource | null
) {
    const allAvailable = await bibleChaptersByBookAvailable(get(isOnline), get(preferredBibleIds));
    if (guide) {
        setCurrentPane(
            new BookChapterSelectorPaneInfo(await bibleChaptersByBookAvailableForGuide(allAvailable, guide.id), guide)
        );
    } else {
        setCurrentPane(new BookChapterSelectorPaneInfo(allAvailable, guide));
    }
}

export async function openPredeterminedPassageSelectorPane(
    setCurrentPane: (currentPane: ContentPaneInfo) => void,
    setCurrentGuide: (currentGuide: ApiParentResource | null) => void,
    closeContextualMenu: () => void,
    guide: ApiParentResource | null,
    currentBibleSection: BibleSection | null,
    showAllAvailable: boolean
) {
    if (guide) {
        const availablePassagesByBook = await passagesByBookAvailableForGuide(guide.id);
        const passagesForCurrentBibleSection = getPassagesForCurrentBibleSection(
            currentBibleSection,
            availablePassagesByBook
        );
        const exactEqualPassage =
            passagesForCurrentBibleSection?.length === 1 &&
            currentBibleSection &&
            bibleSectionsEqual(passagesForCurrentBibleSection[0]!, currentBibleSection);

        if (showAllAvailable || !passagesForCurrentBibleSection?.length) {
            // The user is opening the pane from somewhere where they want to see all available, not scoped
            // just by current Bible section. Or the current Bible section is missing or not overlapping any.
            setCurrentPane(new PredeterminedPassageSelectorPaneInfo(availablePassagesByBook, guide));
        } else if (exactEqualPassage) {
            // One passage matches the current Bible section exactly and we should go straight to it.
            closeContextualMenu();
            setCurrentGuide(guide);
        } else {
            // At least one passage overlaps the current Bible section but not exactly, so let the user pick.
            setCurrentPane(
                new PredeterminedPassageSelectorForBibleSectionPaneInfo(passagesForCurrentBibleSection!, guide)
            );
        }
    }
}

function getPassagesForCurrentBibleSection(
    currentBibleSection: BibleSection | null,
    availablePassagesByBook: BasePassagesByBook[] | null
) {
    if (!currentBibleSection || !availablePassagesByBook) {
        return null;
    }
    return availablePassagesByBook
        .find(({ bookCode }) => bookCode === currentBibleSection?.bookCode)
        ?.passages.filter(
            (p) =>
                (p.startChapter < currentBibleSection.endChapter ||
                    (p.startChapter === currentBibleSection.endChapter &&
                        p.startVerse <= currentBibleSection.endVerse)) &&
                (p.endChapter > currentBibleSection.startChapter ||
                    (p.endChapter === currentBibleSection.startChapter && p.endVerse >= currentBibleSection.startVerse))
        );
}
