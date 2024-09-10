import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

const CONTEXT_KEY = 'resourceFeedbackContext';

export enum ContactType {
    Email = 'Email',
    Phone = 'Phone',
    WhatsApp = 'WhatsApp',
    Signal = 'Signal',
    Other = 'Other',
}

interface ContactInfo {
    contactValue: string;
    contactType: ContactType;
}

function createLocalStorageStore<T>(key: string, initialValue: T | null) {
    const storedValue = localStorage.getItem(key);
    const store = writable<T>(storedValue ? JSON.parse(storedValue) : initialValue);

    store.subscribe((value) => {
        localStorage.setItem(key, JSON.stringify(value));
    });

    return store;
}

export function createResourceFeedbackContext() {
    const modalIsOpenForResourceContentId = writable<number | null>(null);
    const contactInfo = createLocalStorageStore<ContactInfo>('contactInfo', null);

    const context = {
        modalIsOpenForResourceContentId: { subscribe: modalIsOpenForResourceContentId.subscribe },
        contactInfo: { subscribe: contactInfo.subscribe },
        openResourceFeedbackModalForResource(id: number | undefined) {
            modalIsOpenForResourceContentId.set(id ?? null);
        },
        closeResourceFeedbackModal() {
            modalIsOpenForResourceContentId.set(null);
        },
        saveContactInfo(info: ContactInfo) {
            contactInfo.set(info);
        },
    };

    setContext(CONTEXT_KEY, context);

    return context;
}

export function getResourceFeedbackContext() {
    return getContext<ReturnType<typeof createResourceFeedbackContext>>(CONTEXT_KEY);
}
