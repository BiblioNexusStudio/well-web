export const LanguageCode = { ENG: 'eng', HIN: 'hin', TPI: 'tpi' } as const;

export type LanguageCodeEnum = (typeof LanguageCode)[keyof typeof LanguageCode];

export const supportedLanguages = [
    { code: LanguageCode.ENG, label: 'English' },
    { code: LanguageCode.HIN, label: 'हिंदी' },
    { code: LanguageCode.TPI, label: 'Tok Pisin' },
] as { code: LanguageCodeEnum; label: string }[];

export function browserLanguageToISO6393(browserLanguage: string) {
    const twoDigit = browserLanguage.toLowerCase().split('-')[0];
    if (twoDigit === 'en') {
        return 'eng';
    } else if (twoDigit === 'hi') {
        return 'hin';
    }
}
