export const LanguageCode = {
    FRA: 'fra',
    RUS: 'rus',
    SWH: 'swh',
    ENG: 'eng',
    HIN: 'hin',
    TPI: 'tpi',
    ARB: 'arb',
} as const;
export const DirectionCode = { LTR: 'ltr', RTL: 'rtl' } as const;

export type LanguageCodeEnum = (typeof LanguageCode)[keyof typeof LanguageCode];
export type DirectionCodeEnum = (typeof DirectionCode)[keyof typeof DirectionCode];

export const supportedLanguages = [
    { code: LanguageCode.ENG, label: 'English', direction: DirectionCode.LTR },
    { code: LanguageCode.SWH, label: 'Kiswahili', direction: DirectionCode.LTR },
    { code: LanguageCode.FRA, label: 'Français', direction: DirectionCode.LTR },
    { code: LanguageCode.RUS, label: 'Pусский', direction: DirectionCode.LTR },
    { code: LanguageCode.HIN, label: 'हिंदी', direction: DirectionCode.LTR },
    { code: LanguageCode.TPI, label: 'Tok Pisin', direction: DirectionCode.LTR },
    { code: LanguageCode.ARB, label: 'عربي', direction: DirectionCode.RTL },
] as { code: LanguageCodeEnum; label: string; direction: DirectionCodeEnum }[];

export function browserLanguageToISO6393(browserLanguage: string) {
    const twoDigit = browserLanguage.toLowerCase().split('-')[0];
    if (twoDigit === 'en') {
        return 'eng';
    } else if (twoDigit === 'hi') {
        return 'hin';
    }
}
