// eslint-disable-next-line
// @ts-nocheck

import { browser } from '$app/environment';
import { AudioType } from '$lib/components/AudioPlayer/audio-player-state';

export function isSafariOnMacOrIOS() {
    return (
        !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/) ||
        (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
    );
}

export function audioFileTypeForBrowser() {
    return isSafariOnMacOrIOS() ? AudioType.mp3 : AudioType.webm;
}

export const browserSupported = browser && 'serviceWorker' in navigator;
