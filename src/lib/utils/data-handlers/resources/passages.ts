import { get } from 'svelte/store';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import type { PassagesForBook } from '$lib/types/passage-form';
import { data, passagesByBook } from '$lib/stores/passage-form.store';
import { currentLanguageId } from '$lib/stores/current-language.store';
import { fetchFromCacheOrApi, isCachedFromCdn } from '$lib/data-cache';
import { asyncEvery, asyncFilter, asyncSome } from '$lib/utils/async-array';
import type { ApiPassage, ApiBibleVersion, ResourceContentSteps, ResourceContentUrl } from '$lib/types/file-manager';

async function getBibleBookIdsToNameAndIndex(languageId: number | null = null) {
    const bibleData = (await fetchFromCacheOrApi(
        `bibles/language/${languageId || get(currentLanguageId)}`
    )) as ApiBibleVersion[];
    if (bibleData[0]) {
        return bibleData[0].contents.reduce(
            (output, { displayName, bookId }, index) => ({ ...output, [bookId]: { displayName, index } }),
            {} as Record<number, { displayName: string; index: number }>
        );
    } else {
        return getBibleBookIdsToNameAndIndex(1);
    }
}

export async function fetchData(isOnline: boolean) {
    const bibleBookIdsToNameAndIndex = await getBibleBookIdsToNameAndIndex();
    const passagesWithResources = (await fetchFromCacheOrApi(
        `passages/resources/language/${get(currentLanguageId)}`
    )) as ApiPassage[];
    const availableOfflinePassagesWithResources = await asyncFilter(passagesWithResources, async ({ resources }) => {
        return asyncSome(resources, async ({ mediaType, content }) => {
            if (isOnline && content) {
                return true;
            }
            if (mediaType === 1 && content) {
                const textContent = content.content as ResourceContentUrl;
                return await isCachedFromCdn(textContent.url);
            } else if (mediaType === 2 && content) {
                const audioContent = content.content as ResourceContentSteps;
                return asyncEvery(
                    audioContent.steps,
                    async (step) => await isCachedFromCdn(step[audioFileTypeForBrowser()].url)
                );
            } else {
                return false;
            }
        });
    });
    passagesByBook.update(() => {
        return availableOfflinePassagesWithResources
            .reduce((output, passageWithResource) => {
                const bibleBookNameAndIndex = bibleBookIdsToNameAndIndex[passageWithResource.bookId];
                output[bibleBookNameAndIndex.index] ||= {
                    displayName: bibleBookNameAndIndex.displayName,
                    passages: [],
                };
                const bookInfo = output[bibleBookNameAndIndex.index];
                bookInfo.passages.push(passageWithResource);
                return output;
            }, [] as PassagesForBook[])
            .filter(Boolean);
    });
    data.update(() => {
        return { passagesByBook: get(passagesByBook) };
    });
}
