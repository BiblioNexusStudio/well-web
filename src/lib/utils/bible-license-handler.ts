import { writable, derived } from 'svelte/store';
import type { BaseBible } from '$lib/types/bible';

const acceptedLicensesStore = writable<number[]>([]);

function loadAcceptedLicenseBibles(): void {
    const acceptedLicenses = localStorage.getItem('acceptedBibleLicenses');
    acceptedLicensesStore.set(acceptedLicenses ? JSON.parse(acceptedLicenses) : []);
}

export const needsLicenseAccepted = derived([acceptedLicensesStore], ([$acceptedLicenses]) => {
    return (bible: BaseBible) => {
        if (!bible.restrictedLicense) return false;
        return !$acceptedLicenses.includes(bible.id);
    };
});

export function acceptBibleLicense(bible: BaseBible): void {
    if (!bible.restrictedLicense) return;
    acceptedLicensesStore.update((acceptedLicenses) => {
        if (!acceptedLicenses.includes(bible.id)) {
            const updatedLicenses = [...acceptedLicenses, bible.id];
            localStorage.setItem('acceptedBibleLicenses', JSON.stringify(updatedLicenses));
            return updatedLicenses;
        }
        return acceptedLicenses;
    });
}

loadAcceptedLicenseBibles();
