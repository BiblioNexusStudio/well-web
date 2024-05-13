import { get } from 'svelte/store';
import { currentLanguageInfo } from '$lib/stores/language.store';
import { fetchFromCacheOrApi, isCachedFromApi } from '$lib/data-cache';
import { asyncMap, asyncFilter, asyncSome } from '$lib/utils/async-array';
import type { BasePassagesByBook } from '$lib/types/passage';
import { ParentResourceName, ParentResourceType } from '$lib/types/resource';
import { resourceContentsForBibleSection, type AvailableChaptersForResource } from './resource';
import {
    passagesByLanguageAndParentResourceEndpoint,
    resourceContentForBookAndChapter,
    booksAndChaptersByLanguageAndParentResourceEndpoint,
} from '$lib/api-endpoints';
import { range } from '$lib/utils/array';
import { isOnline } from '$lib/stores/is-online.store';
import type { BibleSection, WholeChapterBibleSection } from '$lib/types/bible';

// for a given Bible section, return the guides available
async function guidesAvailableForBibleSection(
    bibleSection: BibleSection | WholeChapterBibleSection
): Promise<ParentResourceName[]> {
    const allResourceContents = await resourceContentsForBibleSection(bibleSection);
    return [
        ...new Set(
            allResourceContents
                .filter((rc) => rc.resourceType === ParentResourceType.Guide)
                .map((rc) => rc.parentResource as ParentResourceName)
        ),
    ];
}

export async function bibleChaptersByBookAvailableForGuide(parentResource: ParentResourceName) {
    const languageId = get(currentLanguageInfo)?.id;
    const online = get(isOnline);
    const booksAndChapters = (await fetchFromCacheOrApi(
        ...booksAndChaptersByLanguageAndParentResourceEndpoint(languageId, parentResource)
    )) as AvailableChaptersForResource[];
    return (
        await asyncMap(booksAndChapters, async (bookAndChapters) => {
            bookAndChapters.chapters = await asyncFilter(bookAndChapters.chapters, async (chapter) => {
                if (online) return true;
                const resourceListForChapterIsCached = await isCachedFromApi(
                    resourceContentForBookAndChapter(languageId, bookAndChapters.bookCode, chapter)[0]
                );
                if (!resourceListForChapterIsCached) return false;
                const guides = await guidesAvailableForBibleSection({
                    bookCode: bookAndChapters.bookCode,
                    startChapter: chapter,
                    endChapter: chapter,
                });
                return guides.includes(parentResource);
            });
            return bookAndChapters;
        })
    ).filter(({ chapters }) => chapters.length > 0);
}

export async function passagesByBookAvailableForGuide(parentResource: ParentResourceName) {
    const online = get(isOnline);
    const languageId = get(currentLanguageInfo)?.id;
    const allPassages = (await fetchFromCacheOrApi(
        ...passagesByLanguageAndParentResourceEndpoint(languageId, parentResource)
    )) as BasePassagesByBook[];
    return (
        await asyncMap(allPassages, async (byBook) => {
            const availablePassages = await asyncFilter(byBook.passages, async (passage) => {
                if (online) return true;
                const resourceListForChapterIsCached = await asyncSome(
                    range(passage.startChapter, passage.endChapter),
                    async (chapter) =>
                        await isCachedFromApi(resourceContentForBookAndChapter(languageId, byBook.bookCode, chapter)[0])
                );
                if (!resourceListForChapterIsCached) return false;
                const guides = await guidesAvailableForBibleSection(passage);
                return guides.includes(parentResource);
            });
            byBook.passages = availablePassages;
            return byBook;
        })
    ).filter(({ passages }) => passages.length > 0);
}
