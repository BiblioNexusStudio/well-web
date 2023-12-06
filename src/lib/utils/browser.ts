// eslint-disable-next-line
// @ts-nocheck

import { browser } from '$app/environment';

export function isSafariOnMacOrIOS() {
    return (
        !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/) ||
        (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
    );
}

export function audioFileTypeForBrowser() {
    return isSafariOnMacOrIOS() ? 'mp3' : 'webm';
}

export const browserSupported = browser && 'serviceWorker' in navigator;
