import { get } from 'svelte/store';
import { currentLanguageInfo } from '$lib/stores/language.store';
import { fetchFromCacheOrApi, isCachedFromApi } from '$lib/data-cache';
import { asyncMap, asyncFilter, asyncSome } from '$lib/utils/async-array';
import type { BasePassagesByBook } from '$lib/types/passage';
import {
    ParentResourceName,
    ParentResourceType,
    type ApiParentResource,
    PredeterminedPassageGuides,
} from '$lib/types/resource';
import { resourceContentsForBibleSection, type AvailableChaptersForResource } from './resource';
import {
    passagesByLanguageAndParentResourceEndpoint,
    resourceContentForBookAndChapter,
    booksAndChaptersByLanguageAndParentResourceEndpoint,
    parentResourcesEndpoint,
} from '$lib/api-endpoints';
import { range } from '$lib/utils/array';
import { isOnline } from '$lib/stores/is-online.store';
import type { BibleSection, WholeChapterBibleSection } from '$lib/types/bible';

// for a given Bible section, return the guides available
export async function guidesAvailableForBibleSection(
    bibleSection: BibleSection | WholeChapterBibleSection
): Promise<ApiParentResource[]> {
    const [allResourceContents, guides] = await Promise.all([
        resourceContentsForBibleSection(bibleSection),
        allGuidesForLanguage(),
    ]);
    const availableGuideNames = [
        ...new Set(
            allResourceContents
                .filter((rc) => rc.resourceType === ParentResourceType.Guide)
                .map((rc) => rc.parentResource as ParentResourceName)
        ),
    ];
    return guides.filter((g) => availableGuideNames.includes(g.shortName));
}

// return the full list of guides available for the current language
// if offline, it only returns guides that have cached content
export async function guidesAvailableInCurrentLanguage() {
    const languageId = get(currentLanguageInfo)?.id;
    const guidesInCurrentLanguage = await allGuidesForLanguage();
    return await asyncFilter(guidesInCurrentLanguage, async (guide) => {
        if (PredeterminedPassageGuides.includes(guide.shortName)) {
            return await isCachedFromApi(passagesByLanguageAndParentResourceEndpoint(languageId, guide.shortName)[0]);
        } else {
            return await isCachedFromApi(
                booksAndChaptersByLanguageAndParentResourceEndpoint(languageId, guide.shortName)[0]
            );
        }
    });
}

async function allGuidesForLanguage() {
    const languageId = get(currentLanguageInfo)?.id;
    const allGuides = (await fetchFromCacheOrApi(
        ...parentResourcesEndpoint(languageId, ParentResourceType.Guide)
    )) as ApiParentResource[];
    return allGuides.filter((pr) => pr.resourceCountForLanguage > 0);
}

// given a specific guide, returns the list of Bible chapters (grouped by book) that have content for that guide
// if offline, returns only chapters with cached content
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
                return guides.some((g) => g.shortName === parentResource);
            });
            return bookAndChapters;
        })
    ).filter(({ chapters }) => chapters.length > 0);
}

// given a specific guide, returns the list of predetermined passages that the guide has
// if offline, returns only passages with cached content
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
                return guides.some((g) => g.shortName === parentResource);
            });
            byBook.passages = availablePassages;
            return byBook;
        })
    ).filter(({ passages }) => passages.length > 0);
}
