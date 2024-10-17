export enum ContactType {
    Email = 'Email',
    Phone = 'Phone',
    WhatsApp = 'WhatsApp',
    Signal = 'Signal',
    Other = 'Other',
}

export interface ContactInfo {
    contactValue: string;
    contactType: ContactType;
}

export enum FeedbackType {
    SettingsFeedbackForm = 'WellSettingsFeedbackForm',
    PromptFeedbackForm = 'WellPopupFeedbackForm',
}

export enum FormType {
    ResourceForm = 'resourceFeedbackForm',
    ContactPromptForm = 'infoPromptForm',
}
