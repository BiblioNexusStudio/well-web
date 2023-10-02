import { unzip } from 'unzipit';
import { asyncMap } from './async-array';

export interface ObjectUrlMapping {
    url?: string | null;
    file: string;
}

export async function readFilesIntoObjectUrlsMapping<T extends ObjectUrlMapping>(zipUrl: string, mapping: T[]) {
    const { entries } = await unzip(zipUrl);
    const fileAndBlob = await asyncMap(Object.entries(entries), async ([key, value]) => [key, await value.blob()]);
    const blobsByFile = Object.fromEntries(fileAndBlob);
    return mapping.map((map) => ({
        ...map,
        url: blobsByFile[map.file] ? URL.createObjectURL(blobsByFile[map.file]) : null,
    }));
}
