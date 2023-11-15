import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import config from '$lib/config';

export const isOnline = writable<boolean>(browser && navigator.onLine);

export function updateOnlineStatus() {
    isOnline.set(navigator.onLine);
    // wait a second for network update to settle and fire a request to check the true online status
    setTimeout(async () => {
        if (navigator.onLine) {
            await checkTrueOnlineStatus();
        }
    }, 1000);
}

// This will catch cases where the user is on Wi-fi or LTE but no actual connection to the internet is there.
async function checkTrueOnlineStatus() {
    try {
        await fetch(config.PUBLIC_IS_ONLINE_CHECK_URL, { mode: 'no-cors', cache: 'no-store' });
        isOnline.set(true);
    } catch {
        isOnline.set(false);
    }
}
