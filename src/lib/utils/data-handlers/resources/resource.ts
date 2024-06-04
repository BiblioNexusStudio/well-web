import { resourceContentForBookAndChapter } from '$lib/api-endpoints';
import {
    apiUrl,
    fetchBatchAndAlreadyCached,
    fetchFromCacheOrApi,
    fetchFromCacheOrCdn,
    isCachedFromCdn,
} from '$lib/data-cache';
import { isOnline } from '$lib/stores/is-online.store';
import { currentLanguageInfo } from '$lib/stores/language.store';
import type { FileManagerResourceContentInfo } from '$lib/types/file-manager';
import type { BibleSection, WholeChapterBibleSection } from '$lib/types/bible';
import {
    MediaType,
    PredeterminedPassageGuides,
    type AssociatedResource,
    type ResourceContentGroupedByVerses,
    type ResourceContentInfo,
    type ResourceContentMetadata,
    type ResourceContentTiptap,
    type TextResourceContentJustId,
    SrvResources,
} from '$lib/types/resource';
import { range } from '$lib/utils/array';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import { get } from 'svelte/store';
import { asyncFilter } from '$lib/utils/async-array';
import { SettingShortNameEnum } from '$lib/types/settings';
import { settings } from '$lib/stores/settings.store';

export function resourceContentApiPath(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo | TextResourceContentJustId
) {
    const mediaType = 'mediaType' in resourceContent ? resourceContent.mediaType : resourceContent.mediaTypeName;
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    if (mediaType === MediaType.Audio) {
        return `/resources/${id}/content?audioType=${audioFileTypeForBrowser()}`;
    } else {
        return `/resources/${id}/content`;
    }
}

export function resourceContentApiFullUrl(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo | TextResourceContentJustId
) {
    return apiUrl(resourceContentApiPath(resourceContent));
}

export function resourceThumbnailApiFullUrl(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    return apiUrl(`/resources/${id}/thumbnail`);
}

export function resourceMetadataApiFullUrl(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo | TextResourceContentJustId
) {
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    return apiUrl(`/resources/${id}/metadata`);
}

export function resourceContentsForBookAndChapterFullUrl(
    languageId: number | undefined,
    bookCode: string,
    chapter: string
) {
    return apiUrl(resourceContentForBookAndChapter(languageId, bookCode, parseInt(chapter))[0]);
}

export interface ResourceContentInfoWithFrontendData extends ResourceContentInfo {
    occurrences: number;
    verses: { chapter: number; verse: number }[];
}

export interface AvailableChaptersForResource {
    bookCode: string;
    chapters: number[];
}

// for a given Bible section, return all resource contents available
// when offline, this will return only resource contents that are cached
export async function resourceContentsForBibleSection(bibleSection: BibleSection | WholeChapterBibleSection) {
    const showOnlySrvResources = !!get(settings).find(
        (setting) => setting.shortName === SettingShortNameEnum.showOnlySrvResources
    )?.value;

    const languageId = get(currentLanguageInfo)?.id;
    const online = get(isOnline);
    const resources = [] as ResourceContentInfoWithFrontendData[];

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
                    if (!showOnlySrvResources || SrvResources.includes(content.parentResourceId)) {
                        if (online || (await isCachedFromCdn(resourceContentApiFullUrl(content)))) {
                            const existing = resources.find((rc) => rc.id === content.id);
                            if (existing) {
                                existing.occurrences += 1;
                                existing.verses.push({ chapter, verse: verse.number });
                            } else {
                                resources.push({
                                    ...content,
                                    occurrences: 1,
                                    verses: [{ chapter, verse: verse.number }],
                                });
                            }
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

    // Because some predetermined passages overlap (e.g. Acts 1:1-9a and Acts 1:9b-15) we want to discard resources if
    // they only link to one verse. This would indicate it's the resource from the "other side" of the overlap.
    for (let i = resources.length - 1; i > 0; i--) {
        if (
            PredeterminedPassageGuides.includes(resources[i]!.parentResourceId) &&
            resources[i]!.occurrences === 1 &&
            !isForSingleVerse
        ) {
            resources.splice(i, 1);
        }
    }

    return resources;
}

export async function fetchTextResourceContentAndMetadataBatched<T extends TextResourceContentJustId>(
    resourceContents: T[]
) {
    const ids = resourceContents.map((rc) => rc.id);

    const [idsToMetadata, idsToContent] = await Promise.all([
        fetchBatchAndAlreadyCached<ResourceContentMetadata>(
            apiUrl('/resources/batch/metadata'),
            ids,
            (id) => resourceMetadataApiFullUrl({ id, mediaType: MediaType.Text }),
            (response) => response,
            100
        ),
        fetchBatchAndAlreadyCached<ResourceContentTiptap[]>(
            apiUrl('/resources/batch/content/text'),
            ids,
            (id) => resourceContentApiFullUrl({ id, mediaType: MediaType.Text }),
            (response) => response.content,
            10
        ),
    ]);

    return resourceContents.map((rc) => ({
        ...rc,
        metadata: idsToMetadata.get(rc.id),
        content: idsToContent.get(rc.id)?.[0] ?? null,
    }));
}

export async function fetchTiptapForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo | TextResourceContentJustId
): Promise<ResourceContentTiptap | null> {
    try {
        const tiptaps = (await fetchFromCacheOrCdn(resourceContentApiFullUrl(resourceContent))) as
            | ResourceContentTiptap[]
            | null;
        return tiptaps?.[0] ?? null;
    } catch (error) {
        // not cached, that's fine
        return null;
    }
}

export async function fetchMetadataForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo | TextResourceContentJustId
): Promise<ResourceContentMetadata | null> {
    try {
        return (await fetchFromCacheOrCdn(
            resourceMetadataApiFullUrl(resourceContent)
        )) as ResourceContentMetadata | null;
    } catch (error) {
        // not cached, that's fine
        return null;
    }
}

export async function filterToAvailableAssociatedResourceContent(
    online: boolean,
    associatedResources: AssociatedResource[] | undefined
) {
    if (!associatedResources || online) {
        return associatedResources;
    }
    return await asyncFilter(associatedResources, async (resource) => {
        const textResourceContentJustId: TextResourceContentJustId = {
            id: resource.contentId,
            mediaType: MediaType.Text,
        };
        return await isCachedFromCdn(resourceContentApiFullUrl(textResourceContentJustId));
    });
}

export async function fetchDisplayNameForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo
): Promise<string | undefined> {
    return (
        ('displayName' in resourceContent && resourceContent.displayName) ||
        (await fetchMetadataForResourceContent(resourceContent))?.displayName ||
        undefined
    );
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
