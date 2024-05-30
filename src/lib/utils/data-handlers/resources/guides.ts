import { get } from 'svelte/store';
import { currentLanguageInfo } from '$lib/stores/language.store';
import { fetchFromCacheOrApi, isCachedFromApi } from '$lib/data-cache';
import { asyncMap, asyncFilter, asyncSome } from '$lib/utils/async-array';
import type { BasePassagesByBook } from '$lib/types/passage';
import {
    ParentResourceId,
    ParentResourceType,
    type ApiParentResource,
    PredeterminedPassageGuides,
    EnabledGuides,
    SrvResources,
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
import type { ApiBibleBook, BibleSection, WholeChapterBibleSection } from '$lib/types/bible';
import { settings } from '$lib/stores/settings.store';
import { SettingShortNameEnum } from '$lib/types/settings';

// for a given Bible section, return the guides available
export async function guidesAvailableForBibleSection(
    bibleSection: BibleSection | WholeChapterBibleSection
): Promise<ApiParentResource[]> {
    const [allResourceContents, guides] = await Promise.all([
        resourceContentsForBibleSection(bibleSection),
        allGuidesForLanguage(),
    ]);
    const availableGuideIds = [
        ...new Set(
            allResourceContents
                .filter((rc) => rc.resourceType === ParentResourceType.Guide)
                .map((rc) => rc.parentResourceId)
        ),
    ];
    return guides.filter((g) => availableGuideIds.includes(g.id));
}

// return the full list of guides available for the current language
// if offline, it only returns guides that have cached content
export async function guidesAvailableInCurrentLanguage() {
    const languageId = get(currentLanguageInfo)?.id;
    const guidesInCurrentLanguage = await allGuidesForLanguage();
    const online = get(isOnline);
    if (online) {
        return guidesInCurrentLanguage;
    } else {
        return await asyncFilter(guidesInCurrentLanguage, async (guide) => {
            if (PredeterminedPassageGuides.includes(guide.id)) {
                return await isCachedFromApi(passagesByLanguageAndParentResourceEndpoint(languageId, guide.id)[0]);
            } else {
                return await isCachedFromApi(
                    booksAndChaptersByLanguageAndParentResourceEndpoint(languageId, guide.id)[0]
                );
            }
        });
    }
}

export async function parentResourcesForCurrentLanguage() {
    const showOnlySrvResources = !!get(settings).find(
        (setting) => setting.shortName === SettingShortNameEnum.showOnlySrvResources
    )?.value;
    const languageId = get(currentLanguageInfo)?.id;
    const allParentResources = (await fetchFromCacheOrApi(
        ...parentResourcesEndpoint(languageId)
    )) as ApiParentResource[];
    return allParentResources.filter(
        (pr) => (!showOnlySrvResources || SrvResources.includes(pr.id)) && pr.enabled && pr.resourceCountForLanguage > 0
    );
}

async function allGuidesForLanguage() {
    return (await parentResourcesForCurrentLanguage()).filter(
        (pr) => pr.resourceType === ParentResourceType.Guide && EnabledGuides.includes(pr.id)
    );
}

// given a list of Bible books/chapters available and a specific guide, filters down the list of Bible books/chapters to
// only what is available for the guide
// if offline, returns only chapters with cached content
export async function bibleChaptersByBookAvailableForGuide(
    bibleBooks: ApiBibleBook[],
    parentResource: ParentResourceId
) {
    const languageId = get(currentLanguageInfo)?.id;
    const online = get(isOnline);
    const booksAndChapters = (await fetchFromCacheOrApi(
        ...booksAndChaptersByLanguageAndParentResourceEndpoint(languageId, parentResource)
    )) as AvailableChaptersForResource[];
    return (
        await asyncMap(bibleBooks, async (bibleBook) => {
            const guideAvailableBook = booksAndChapters.find((bc) => bc.bookCode === bibleBook.code);
            if (guideAvailableBook) {
                bibleBook.chapters = await asyncFilter(bibleBook.chapters, async (chapter) => {
                    if (!guideAvailableBook.chapters.includes(chapter.number)) return false;
                    if (online) return true;
                    const resourceListForChapterIsCached = await isCachedFromApi(
                        resourceContentForBookAndChapter(languageId, guideAvailableBook.bookCode, chapter.number)[0]
                    );
                    if (!resourceListForChapterIsCached) return false;
                    const guides = await guidesAvailableForBibleSection({
                        bookCode: guideAvailableBook.bookCode,
                        startChapter: chapter.number,
                        endChapter: chapter.number,
                    });
                    return guides.some((g) => g.id === parentResource);
                });
            } else {
                bibleBook.chapters = [];
            }
            return bibleBook;
        })
    ).filter(({ chapters }) => chapters.length > 0);
}

// given a specific guide, returns the list of predetermined passages that the guide has
// if offline, returns only passages with cached content
export async function passagesByBookAvailableForGuide(parentResource: ParentResourceId) {
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
                return guides.some((g) => g.id === parentResource);
            });
            byBook.passages = availablePassages;
            return byBook;
        })
    ).filter(({ passages }) => passages.length > 0);
}
