export function filterItemsByKeyMatchingSearchQuery<T>(items: T[], key: keyof T, searchQuery: string): T[] {
    if (!shouldSearch(searchQuery) || (searchQuery.length === 0 && items.length > 0)) {
        return items;
    }

    return items.filter((item) => {
        const value = item[key];
        if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
            return false;
        }
    });
}

export function shouldSearch(searchQuery: string) {
    return searchQuery.length >= 2;
}

export function htmlWithHighlightedSearchString(text: string | null, searchQuery: string): string | null {
    if (!text) {
        return null;
    }

    const escapeHtml = (unsafe: string) =>
        unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    text = escapeHtml(text);
    searchQuery = escapeHtml(searchQuery);

    if (shouldSearch(searchQuery)) {
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.replace(regex, '<b>$1</b>');
    }
    return text;
}
