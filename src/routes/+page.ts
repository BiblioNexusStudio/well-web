import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { currentLanguageId } from '$lib/stores/current-language.store';
import { fetchFromCacheOrApi } from '$lib/data-cache';
import type { BibleVersionBookContent, Passage, Resource } from '$lib/types/fileManager';

async function getBibleBookIdsToNameAndIndex() {
    const [{ contents: books }]: [{ contents: BibleVersionBookContent[] }] = await fetchFromCacheOrApi(
        `bibles/language/${get(currentLanguageId)}`
    );
    return books.reduce(
        (output, { displayName, bookId }, index) => ({ ...output, [bookId]: { displayName, index } }),
        {} as Record<number, { displayName: string; index: number }>
    );
}

export const load = (async ({ parent }) => {
    await parent(); // ensure languages have loaded
    const bibleBookIdsToNameAndIndex = await getBibleBookIdsToNameAndIndex();
    const passagesWithResources = (await fetchFromCacheOrApi(
        `resources/language/${get(currentLanguageId)}`
    )) as Resource[];
    const passagesByBook = passagesWithResources
        .reduce((output, passageWithResource) => {
            const passage = passageWithResource.passages[0];
            const bibleBookNameAndIndex = bibleBookIdsToNameAndIndex[passage.bookId];
            output[bibleBookNameAndIndex.index] ||= {
                displayName: bibleBookNameAndIndex.displayName,
                passages: [],
            };
            const bookInfo = output[bibleBookNameAndIndex.index];
            bookInfo.passages.push(passage);
            return output;
        }, [])
        .filter(Boolean);
    return { passagesByBook } as { passagesByBook: { displayName: string; passages: Passage }[] };
}) satisfies PageLoad;
