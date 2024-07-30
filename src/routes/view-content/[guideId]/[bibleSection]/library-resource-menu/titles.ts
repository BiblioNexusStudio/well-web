import type { LibraryResourceGrouping } from '../library-resource-loader';

export function parseSubtitle(text: string | undefined) {
    if (!text) return '';
    const start = text.indexOf('(');
    if (start > 0) {
        return text.substring(start + 1, text.indexOf(')'));
    }
    return '';
}

export function parseTitle(text: string | undefined) {
    if (!text) return '';
    const start = text.indexOf('(');
    if (start > 0 && start > 1) {
        return text.substring(0, start);
    } else {
        // rtl
        return text.substring(text.indexOf(')') + 1, text.length - 1);
    }
}

export function titleWithSubtitleFromResourceGrouping(resourceGrouping: LibraryResourceGrouping | null) {
    return `${parseTitle(resourceGrouping?.parentResource.displayName)} (${parseSubtitle(
        resourceGrouping?.parentResource.displayName
    )})`;
}

export function titleObjectFromResourceGrouping(resourceGrouping: LibraryResourceGrouping | null) {
    return {
        title: parseTitle(resourceGrouping?.parentResource.displayName),
        subtitle: parseSubtitle(resourceGrouping?.parentResource.displayName),
    };
}
