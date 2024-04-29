import { env } from '$env/dynamic/public';
import { get } from 'svelte/store';
import { data, passagesByBook } from '$lib/stores/passage-form.store';
import { currentLanguageInfo } from '$lib/stores/language.store';
import { fetchFromCacheOrApi, isCachedFromApi, isCachedFromCdn } from '$lib/data-cache';
import { asyncMap, asyncSome, asyncFilter } from '$lib/utils/async-array';
import type { ApiBible } from '$lib/types/bible-text-content';
import type {
    BasePassagesByBook,
    FrontendPassagesByBook,
    PassageWithResourceContentIds,
    BasePassage,
} from '$lib/types/passage';
import { ParentResourceName } from '$lib/types/resource';
import { resourceContentApiFullUrl } from './resource';
import {
    biblesForLanguageEndpoint,
    passageDetailsByIdAndLanguage,
    passagesByLanguageAndParentResourceEndpoint,
    bibleBooksByBibleId,
    bibleTextByParams,
} from '$lib/api-endpoints';

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

async function passageIdHasCbbterAvailable(passageId: number, isOnline: boolean) {
    if (isOnline) return true;
    const languageId = get(currentLanguageInfo)?.id;
    if (await isCachedFromApi(passageDetailsByIdAndLanguage(passageId, languageId)[0])) {
        const passageWithContentIds = (await fetchFromCacheOrApi(
            ...passageDetailsByIdAndLanguage(passageId, languageId)
        )) as PassageWithResourceContentIds;
        const cbbterResources = passageWithContentIds.contents.filter(
            ({ parentResourceName }) => parentResourceName === ParentResourceName.CBBTER
        );
        return await asyncSome(cbbterResources, async (resourceContent) => {
            return isCachedFromCdn(resourceContentApiFullUrl(resourceContent));
        });
    }
    return false;
}

export async function fetchCbbterPassagesByBook(isOnline: boolean) {
    const bibleBookCodesToName = await getBibleBookCodesToName();
    const allPassages = (await fetchFromCacheOrApi(
        ...passagesByLanguageAndParentResourceEndpoint(get(currentLanguageInfo)?.id, ParentResourceName.CBBTER)
    )) as BasePassagesByBook[];
    const byBookWithAvailableResources = (
        await asyncMap(allPassages, async (byBook, index) => {
            const passages = await asyncFilter(byBook.passages, async ({ id }) => {
                return await passageIdHasCbbterAvailable(id, isOnline);
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

export function passageContentApiPath(passage: BasePassage) {
    return `passages/${passage.id}/language/${get(currentLanguageInfo)?.id}`;
}

export function passageContentApiFullPath(passage: BasePassage) {
    return env.PUBLIC_AQUIFER_API_URL + passageContentApiPath(passage);
}

export function getBibleBooksByBibleId(bibleId: number) {
    return fetchFromCacheOrApi(...bibleBooksByBibleId(bibleId));
}

export function getBibleTextByParams(bibleId: number, params: string[]) {
    return fetchFromCacheOrApi(...bibleTextByParams(bibleId, params));
}
