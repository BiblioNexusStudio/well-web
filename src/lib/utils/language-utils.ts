export enum DirectionCode {
    LTR = 'LTR',
    RTL = 'RTL',
}

export function browserLanguageToISO6393(browserLanguage: string) {
    const twoOrThreeChar = browserLanguage.toLowerCase().split('-')[0];
    switch (twoOrThreeChar) {
        case 'en':
            return 'eng';
        case 'hi':
            return 'hin';
        case 'ar':
            return 'arb';
        case 'ru':
            return 'rus';
        case 'es':
            return 'spa';
        case 'fr':
            return 'fra';
        case 'sw':
            return 'swh';
        default:
            return twoOrThreeChar;
    }
}

export function handleRtlVerseReferences(string: string | undefined, scriptDirection: DirectionCode | undefined) {
    if (scriptDirection === DirectionCode.RTL && string) {
        return string.replaceAll(/(\d+):(\d+)/g, '$1\u200A:\u200A$2');
    }
    return string;
}
