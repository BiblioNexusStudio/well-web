export const LanguageCode = { ENG: 'eng', HIN: 'hin', TPI: 'tpi' } as const;
export const DirectionCode = { LTR: 'ltr', RTL: 'rtl' } as const;

export type LanguageCodeEnum = (typeof LanguageCode)[keyof typeof LanguageCode];
export type DirectionCodeEnum = (typeof DirectionCode)[keyof typeof DirectionCode];

export const supportedLanguages = [
    { code: LanguageCode.ENG, label: 'English', direction: DirectionCode.LTR },
    { code: LanguageCode.HIN, label: 'हिंदी', direction: DirectionCode.LTR },
    { code: LanguageCode.TPI, label: 'Tok Pisin', direction: DirectionCode.LTR },
] as { code: LanguageCodeEnum; label: string; direction: DirectionCodeEnum }[];

export function browserLanguageToISO6393(browserLanguage: string) {
    const twoDigit = browserLanguage.toLowerCase().split('-')[0];
    if (twoDigit === 'en') {
        return 'eng';
    } else if (twoDigit === 'hi') {
        return 'hin';
    }
}
