export const supportedLanguages = [
    { code: 'eng', label: 'English' },
    { code: 'hin', label: 'हिंदी' },
    { code: 'tpi', label: 'Tok Pisin' },
];

export function browserLanguageToISO6393(browserLanguage: string) {
    const twoDigit = browserLanguage.toLowerCase().split('-')[0];
    if (twoDigit === 'en') {
        return 'eng';
    } else if (twoDigit === 'hi') {
        return 'hin';
    }
}
