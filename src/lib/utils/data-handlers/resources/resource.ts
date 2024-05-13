import { env } from '$env/dynamic/public';
import { resourceContentForBookAndChapter } from '$lib/api-endpoints';
import { fetchFromCacheOrApi, fetchFromCacheOrCdn, isCachedFromCdn } from '$lib/data-cache';
import { log } from '$lib/logger';
import { isOnline } from '$lib/stores/is-online.store';
import { currentLanguageInfo } from '$lib/stores/language.store';
import type { FileManagerResourceContentInfo } from '$lib/types/file-manager';
import type { BibleSection, WholeChapterBibleSection } from '$lib/types/bible';
import {
    MediaType,
    ParentResourceName,
    PredeterminedPassageGuides,
    type ResourceContentGroupedByVerses,
    type ResourceContentInfo,
    type ResourceContentMetadata,
    type ResourceContentTiptap,
} from '$lib/types/resource';
import { range } from '$lib/utils/array';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import { get } from 'svelte/store';

export function resourceContentApiPath(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    const mediaType = 'mediaType' in resourceContent ? resourceContent.mediaType : resourceContent.mediaTypeName;
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    if (mediaType === MediaType.Audio) {
        return `resources/${id}/content?audioType=${audioFileTypeForBrowser()}`;
    } else {
        return `resources/${id}/content`;
    }
}

export function resourceContentApiFullUrl(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    return env.PUBLIC_AQUIFER_API_URL + resourceContentApiPath(resourceContent);
}

export function resourceThumbnailApiFullUrl(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    return env.PUBLIC_AQUIFER_API_URL + `resources/${id}/thumbnail`;
}

export function resourceMetadataApiFullPath(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    return env.PUBLIC_AQUIFER_API_URL + `resources/${id}/metadata`;
}

interface ResourceContentInfoWithOccurrences extends ResourceContentInfo {
    occurrences: number;
}

export interface AvailableChaptersForResource {
    bookCode: string;
    chapters: number[];
}

// for a given Bible section, return all resource contents available
// when offline, this will return only resource contents that are cached
export async function resourceContentsForBibleSection(
    bibleSection: BibleSection | WholeChapterBibleSection
): Promise<ResourceContentInfo[]> {
    const languageId = get(currentLanguageInfo)?.id;
    const online = get(isOnline);
    const resources = [] as ResourceContentInfoWithOccurrences[];

    for (const chapter of range(bibleSection.startChapter, bibleSection.endChapter)) {
        let resourcesForChapter: ResourceContentGroupedByVerses | undefined;
        try {
            resourcesForChapter = (await fetchFromCacheOrApi(
                ...resourceContentForBookAndChapter(languageId, bibleSection.bookCode, chapter)
            )) as ResourceContentGroupedByVerses;
        } catch {
            // no problem, just means we haven't catched the resource content list
        }
        for (const verse of resourcesForChapter?.verses ?? []) {
            if (
                !('startVerse' in bibleSection) ||
                !('endVerse' in bibleSection) ||
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
                        const existing = resources.find((rc) => rc.id === content.id);
                        if (existing) {
                            existing.occurrences += 1;
                        } else {
                            resources.push({ ...content, occurrences: 1 });
                        }
                    }
                }
            }
        }
    }

    const isForSingleVerse =
        bibleSection.startChapter === bibleSection.endChapter &&
        'startVerse' in bibleSection &&
        'endVerse' in bibleSection &&
        bibleSection.startVerse === bibleSection.endVerse;

    for (let i = resources.length - 1; i > 0; i--) {
        if (
            PredeterminedPassageGuides.includes(resources[i]!.parentResource as ParentResourceName) &&
            resources[i]!.occurrences === 1 &&
            !isForSingleVerse
        ) {
            resources.splice(i, 1);
        }
    }

    return resources;
}

export async function fetchTiptapForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo
): Promise<ResourceContentTiptap | null> {
    try {
        const tiptaps = (await fetchFromCacheOrCdn(resourceContentApiFullUrl(resourceContent))) as
            | ResourceContentTiptap[]
            | null;
        return tiptaps?.[0] ?? null;
    } catch (error) {
        // tiptap data not cached
        log.exception(error as Error);
        return null;
    }
}

export async function fetchMetadataForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo
): Promise<ResourceContentMetadata | null> {
    try {
        return (await fetchFromCacheOrCdn(
            resourceMetadataApiFullPath(resourceContent)
        )) as ResourceContentMetadata | null;
    } catch (error) {
        // metadata not cached
        log.exception(error as Error);
        return null;
    }
}

export async function fetchDisplayNameForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo
): Promise<string | null> {
    return (await fetchMetadataForResourceContent(resourceContent))?.displayName || null;
}

export function resourceDisplayNameSorter(a: { displayName: string | null }, b: { displayName: string | null }) {
    const passageRegex = /.*(\d+)(?:\.|:)(\d+)-?(\d+)?.*/;
    const aMatch = a.displayName?.match(passageRegex);
    const bMatch = b.displayName?.match(passageRegex);
    if (aMatch && bMatch) {
        const aId = parseInt(aMatch[1]!) * 1000000 + parseInt(aMatch[2]!) * 1000 + parseInt(aMatch[3] ?? '0');
        const bId = parseInt(bMatch[1]!) * 1000000 + parseInt(bMatch[2]!) * 1000 + parseInt(bMatch[3] ?? '0');
        return aId - bId;
    } else if (a.displayName && b.displayName) {
        return a.displayName.localeCompare(b.displayName);
    } else {
        return 0;
    }
}
