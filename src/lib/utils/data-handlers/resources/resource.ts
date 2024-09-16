import { resourceContentForBookAndChapter } from '$lib/api-endpoints';
import {
    apiUrl,
    fetchContentOrMetadataBatchFromCacheAndNetwork,
    fetchFromCacheOrApi,
    fetchContentFromCacheOrNetwork,
    isCachedAsContent,
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
    type BasicTextResourceContent,
    SrvResources,
} from '$lib/types/resource';
import { range } from '$lib/utils/array';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import { get } from 'svelte/store';
import { asyncFilter } from '$lib/utils/async-array';
import { SettingShortNameEnum } from '$lib/types/settings';
import { settings } from '$lib/stores/settings.store';

interface ResourceContentInfoForPath {
    mediaType?: MediaType;
    mediaTypeName?: MediaType;
    id?: number;
    contentId?: number;
    version?: number;
}

function resourceContentApiPath(resourceContent: ResourceContentInfoForPath) {
    const mediaType = 'mediaType' in resourceContent ? resourceContent.mediaType : resourceContent.mediaTypeName;
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    if (mediaType === MediaType.Audio) {
        return `/resources/${id}/content?audioType=${audioFileTypeForBrowser()}&version=${
            resourceContent.version ?? -1
        }`;
    } else {
        return `/resources/${id}/content?version=${resourceContent.version ?? -1}`;
    }
}

export function resourceContentApiFullUrl(resourceContent: ResourceContentInfoForPath) {
    return apiUrl(resourceContentApiPath(resourceContent));
}

export function resourceThumbnailApiFullUrl(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    return apiUrl(`/resources/${id}/thumbnail`);
}

export function resourceMetadataApiFullUrl(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo | BasicTextResourceContent
) {
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    return apiUrl(`/resources/${id}/metadata?version=${resourceContent.version}`);
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
                        if (online || (await isCachedAsContent(resourceContentApiFullUrl(content)))) {
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

export async function fetchTextResourceContentAndMetadataBatched<T extends BasicTextResourceContent>(
    resourceContents: T[]
) {
    const ids = resourceContents.map((rc) => rc.id);
    const idsToVersions = new Map<number, number>();
    resourceContents.forEach((rc) => idsToVersions.set(rc.id, rc.version));

    const [idsToMetadata, idsToContent] = await Promise.all([
        fetchContentOrMetadataBatchFromCacheAndNetwork<ResourceContentMetadata>(
            apiUrl('/resources/batch/metadata'),
            ids,
            (id) => resourceMetadataApiFullUrl({ id, version: idsToVersions.get(id)!, mediaType: MediaType.Text }),
            (response) => response,
            true,
            100
        ),
        fetchContentOrMetadataBatchFromCacheAndNetwork<ResourceContentTiptap[]>(
            apiUrl('/resources/batch/content/text'),
            ids,
            (id) => resourceContentApiFullUrl({ id, version: idsToVersions.get(id)!, mediaType: MediaType.Text }),
            (response) => response.content,
            false,
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
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo | BasicTextResourceContent
): Promise<ResourceContentTiptap | null> {
    try {
        const tiptaps = (await fetchContentFromCacheOrNetwork(resourceContentApiFullUrl(resourceContent))) as
            | ResourceContentTiptap[]
            | null;
        return tiptaps?.[0] ?? null;
    } catch (error) {
        // not cached, that's fine
        return null;
    }
}

export async function fetchMetadataForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo | BasicTextResourceContent
): Promise<ResourceContentMetadata | null> {
    try {
        return (await fetchContentFromCacheOrNetwork(
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
        const textResourceContentJustId: BasicTextResourceContent = {
            id: resource.contentId,
            version: -1,
            mediaType: MediaType.Text,
        };
        return await isCachedAsContent(resourceContentApiFullUrl(textResourceContentJustId));
    });
}

export function sortByDisplayName<T extends { displayName: string | undefined; sortOrder?: number }>(
    resources: T[]
): T[] {
    return resources.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
            if (a.sortOrder !== b.sortOrder) {
                return a.sortOrder - b.sortOrder;
            }
        }
        return (a.displayName ?? '').localeCompare(b.displayName ?? '', undefined, { numeric: true });
    });
}

interface Node {
    type: string;
    attrs: {
        src: string;
        poster?: string;
    };
    content: { type: string; attrs: object; content: object[] }[];
}

export function addThumbnailToVideo(tiptap: ResourceContentTiptap) {
    const video = tiptap.tiptap.content.find((node): node is Node => node.type === 'video');
    const images = tiptap.tiptap.content.filter((node): node is Node => node.type === 'image');
    if (video && images.length > 0) {
        let url = '';

        if (images.length >= 3) {
            url = images[2]?.attrs?.src ?? '';
        } else {
            url = images[images.length - 1]?.attrs?.src ?? '';
        }

        video.attrs.poster = url;
    }
}
