import { browser } from '$app/environment';
import localforage from 'localforage';

// LocalForage is set to use IndexedDB but will fall back to localStorage if that doesn't work.
if (browser) {
    localforage.config({
        driver: localforage.INDEXEDDB,
        name: 'well_dynamic_data',
        version: 1.0,
        storeName: 'well_dynamic_data',
        description: 'Dynamic data storage for Well',
    });
}

// For the given key, get an existing value or default to empty object.
// Call the `updater` function with said object, and set the key with whatever
// the `updater` returns.
export async function updateRow(key: string, updater: (current: object) => object) {
    const current = await selectRow(key);
    return await localforage.setItem(key, updater(current || {}));
}

// Get the object that exists at the given key, or `null`
export async function selectRow(key: string): Promise<object | null> {
    return await localforage.getItem(key);
}

// Save to the Service Worker Cache
export async function saveRecordingToCache(blob: Blob, extension: string): Promise<string> {
    const path = '/__local_recordings/' + generateRecordingId() + '.' + extension;
    const cache = await caches.open('local-recordings');
    const request = new Request(path);
    await cache.put(request, new Response(blob));
    return path;
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
