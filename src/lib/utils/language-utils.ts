export enum DirectionCode {
    LTR = 'LTR',
    RTL = 'RTL',
}

export function browserLanguageToISO6393(browserLanguage: string) {
    const twoDigit = browserLanguage.toLowerCase().split('-')[0];
    if (twoDigit === 'en') {
        return 'eng';
    } else if (twoDigit === 'hi') {
        return 'hin';
    }
}

export function handleRtlVerseReferences(string: string | undefined, scriptDirection: DirectionCode | undefined) {
    if (scriptDirection === DirectionCode.RTL && string) {
        return string.replaceAll(/(\d+):(\d+)/g, '$1\u200A:\u200A$2');
    }
    return string;
}
