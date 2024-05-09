import { get } from 'svelte/store';
import { data, passagesByBook } from '$lib/stores/passage-form.store';
import { currentLanguageInfo } from '$lib/stores/language.store';
import { fetchFromCacheOrApi, isCachedFromApi, isCachedFromCdn } from '$lib/data-cache';
import { asyncMap, asyncFilter, asyncReduce } from '$lib/utils/async-array';
import type { ApiBible } from '$lib/types/bible-text-content';
import type { BasePassagesByBook, FrontendPassagesByBook, BibleSection } from '$lib/types/passage';
import {
    ParentResourceName,
    ParentResourceType,
    type ResourceContentInfo,
    type ResourceContentGroupedByVerses,
} from '$lib/types/resource';
import { resourceContentApiFullUrl } from './resource';
import {
    biblesForLanguageEndpoint,
    passagesByLanguageAndParentResourceEndpoint,
    bibleBooksByBibleId,
    bibleTextByParams,
    resourceContentForBookAndChapter,
} from '$lib/api-endpoints';
import { range } from '$lib/utils/array';
import { isOnline } from '$lib/stores/is-online.store';

async function getBibleBookCodesToName(languageId: number | null = null, retry = true) {
    const bibleData = (await fetchFromCacheOrApi(
        ...biblesForLanguageEndpoint(languageId || get(currentLanguageInfo)?.id)
    )) as ApiBible[];
    if (bibleData[0]) {
        return bibleData[0].books.reduce(
            (output, { displayName, bookCode }) => ({ ...output, [bookCode]: displayName }),
            {} as Record<string, string>
        );
    } else {
        if (retry && (languageId !== 1 || get(currentLanguageInfo)?.id !== 1)) {
            return getBibleBookCodesToName(1, false);
        }
    }
}

// for a given Bible section, return all resource contents available
// when offline, this will return only resource contents that are cached
export async function resourceContentsForBibleSection(bibleSection: BibleSection): Promise<ResourceContentInfo[]> {
    const languageId = get(currentLanguageInfo)?.id;
    const online = get(isOnline);
    return asyncReduce(
        range(bibleSection.startChapter, bibleSection.endChapter),
        async (resourceContents, chapter) => {
            const resourcesForChapter = (await fetchFromCacheOrApi(
                ...resourceContentForBookAndChapter(languageId, bibleSection.bookCode, chapter)
            )) as ResourceContentGroupedByVerses;
            for (const verse of resourcesForChapter.verses) {
                if (
                    (chapter === bibleSection.startChapter &&
                        chapter === bibleSection.endChapter &&
                        verse.number >= bibleSection.startVerse &&
                        verse.number <= bibleSection.endVerse) ||
                    (chapter === bibleSection.startChapter &&
                        chapter !== bibleSection.endChapter &&
                        verse.number >= bibleSection.startVerse) ||
                    (chapter === bibleSection.endChapter &&
                        chapter !== bibleSection.startChapter &&
                        verse.number <= bibleSection.endVerse) ||
                    (chapter > bibleSection.startChapter && chapter < bibleSection.endChapter)
                ) {
                    for (const content of verse.resourceContents) {
                        if (online || (await isCachedFromCdn(resourceContentApiFullUrl(content)))) {
                            if (!resourceContents.find((rc) => rc.id === content.id)) {
                                resourceContents.push(content);
                            }
                        }
                    }
                }
            }
            return resourceContents;
        },
        [] as ResourceContentInfo[]
    );
}

// for a given Bible section, return the guides available
// it is a mapping with the guide parent resource short name -> list of resource contents that are part of the guide
async function guidesAvailableForBibleSection(
    bibleSection: BibleSection
): Promise<Record<string, ResourceContentInfo[]>> {
    const languageId = get(currentLanguageInfo)?.id;
    const online = get(isOnline);
    return asyncReduce(
        range(bibleSection.startChapter, bibleSection.endChapter),
        async (guidesToContents, chapter) => {
            if (
                online ||
                (await isCachedFromApi(resourceContentForBookAndChapter(languageId, bibleSection.bookCode, chapter)[0]))
            ) {
                const potentialGuideResourceContent = (await fetchFromCacheOrApi(
                    ...resourceContentForBookAndChapter(languageId, bibleSection.bookCode, chapter)
                )) as ResourceContentGroupedByVerses;
                for (const verse of potentialGuideResourceContent.verses) {
                    if (
                        (chapter === bibleSection.startChapter &&
                            chapter === bibleSection.endChapter &&
                            verse.number >= bibleSection.startVerse &&
                            verse.number <= bibleSection.endVerse) ||
                        (chapter === bibleSection.startChapter &&
                            chapter !== bibleSection.endChapter &&
                            verse.number >= bibleSection.startVerse) ||
                        (chapter === bibleSection.endChapter &&
                            chapter !== bibleSection.startChapter &&
                            verse.number <= bibleSection.endVerse) ||
                        (chapter > bibleSection.startChapter && chapter < bibleSection.endChapter)
                    ) {
                        for (const content of verse.resourceContents) {
                            if (
                                content.resourceType === ParentResourceType.Guide &&
                                !guidesToContents[content.parentResource]?.find((c) => c.id === content.id)
                            ) {
                                if (await isCachedFromCdn(resourceContentApiFullUrl(content))) {
                                    guidesToContents[content.parentResource]!.push(content);
                                }
                            }
                        }
                    }
                }
            }
            return guidesToContents;
        },
        {} as Record<string, ResourceContentInfo[]>
    );
}

export async function fetchCbbterPassagesByBook() {
    const bibleBookCodesToName = await getBibleBookCodesToName();
    const online = get(isOnline);
    const allPassages = (await fetchFromCacheOrApi(
        ...passagesByLanguageAndParentResourceEndpoint(get(currentLanguageInfo)?.id, ParentResourceName.CBBTER)
    )) as BasePassagesByBook[];
    const byBookWithAvailableResources = (
        await asyncMap(allPassages, async (byBook, index) => {
            const passages = await asyncFilter(byBook.passages, async (passage) => {
                return online || 'CBBTER' in (await guidesAvailableForBibleSection(passage));
            });
            byBook.passages = passages;
            return bibleBookCodesToName
                ? { ...byBook, index, bookName: bibleBookCodesToName[byBook.bookCode] }
                : { ...byBook, index, bookName: undefined };
        })
    ).filter(({ passages }) => passages.length > 0) as FrontendPassagesByBook[];

    passagesByBook.set(byBookWithAvailableResources);
    data.set({ passagesByBook: get(passagesByBook) });
}

export function getBibleBooksByBibleId(bibleId: number) {
    return fetchFromCacheOrApi(...bibleBooksByBibleId(bibleId));
}

export function getBibleTextByParams(bibleId: number, params: string[]) {
    return fetchFromCacheOrApi(...bibleTextByParams(bibleId, params));
}
