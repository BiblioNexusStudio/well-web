import { browser } from '$app/environment';
import { get, readable, writable } from 'svelte/store';
import staticUrls from '$lib/static-urls-map.json' assert { type: 'json' };

export const isApkMode = readable<boolean>(!!Object.keys(staticUrls).length);

export const isOnline = writable<boolean>(browser && navigator.onLine && !get(isApkMode));

export function updateOnlineStatus() {
    isOnline.set(navigator.onLine && !get(isApkMode));
    // wait a second for network update to settle and fire a request to check the true online status
    setTimeout(async () => {
        if (navigator.onLine && !get(isApkMode)) {
            await checkTrueOnlineStatus();
        }
    }, 1000);
}

// This will catch cases where the user is on Wi-fi or LTE but no actual connection to the internet is there.
async function checkTrueOnlineStatus() {
    const res = await fetch('/empty-file.txt', { cache: 'no-store' });
    isOnline.set(res.status === 200);
}
