export enum DirectionCode {
    LTR = 'ltr',
    RTL = 'rtl',
}

export function browserLanguageToISO6393(browserLanguage: string) {
    const twoDigit = browserLanguage.toLowerCase().split('-')[0];
    if (twoDigit === 'en') {
        return 'eng';
    } else if (twoDigit === 'hi') {
        return 'hin';
    }
}
