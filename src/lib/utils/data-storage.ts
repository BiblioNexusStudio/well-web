import { browser } from '$app/environment';
import localforage from 'localforage';

if (browser) {
    localforage.config({
        driver: localforage.INDEXEDDB,
        name: 'well_dynamic_data',
        version: 1.0,
        storeName: 'well_dynamic_data',
        description: 'Dynamic data storage for Aquifer',
    });
}

export async function saveRecordingToCache(blob: Blob, extension: string): Promise<string> {
    const path = '/__local_recordings/' + generateRecordingId() + '.' + extension;
    const cache = await caches.open('local-recordings');
    const request = new Request(path);
    await cache.put(request, new Response(blob));
    return path;
}

export async function updateRow(key: string, updater: (current: object) => object) {
    const current = await selectRow(key);
    return await localforage.setItem(key, updater(current || {}));
}

export async function selectRow(key: string): Promise<object | null> {
    return await localforage.getItem(key);
}

function generateRecordingId() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 16) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
