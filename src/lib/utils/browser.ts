function isIOSSafari() {
    return /iP(ad|hone|od).+Version\/[\d.]+.*Safari/i.test(navigator.userAgent);
}

export function audioFileTypeForBrowser() {
    return isIOSSafari() ? 'mp3' : 'webm';
}
