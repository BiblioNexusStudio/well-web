export const supportedLanguages = [
    { id: 'eng', label: 'English' },
    { id: 'hin', label: 'हिंदी' },
    { id: 'tpi', label: 'Tok Pisin' },
];

export function browserLanguageToISO6393(browserLanguage: string) {
    const twoDigit = browserLanguage.toLowerCase().split('-')[0];
    if (twoDigit === 'en') {
        return 'eng';
    } else if (twoDigit === 'hi') {
        return 'hindi';
    }
}
