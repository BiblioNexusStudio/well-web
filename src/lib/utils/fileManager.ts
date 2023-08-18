import type { BibleBook } from '$lib/types/fileManager';

export const convertToReadableSize = (size: number) => {
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;

    if (isNaN(size)) {
        return 'Invalid input';
    }

    if (size < kb) {
        return `${size.toFixed(2)} B`;
    } else if (size < mb) {
        return `${(size / kb).toFixed(2)} KB`;
    } else if (size < gb) {
        return `${(size / mb).toFixed(2)} MB`;
    } else {
        return `${(size / gb).toFixed(2)} GB`;
    }
};

export const addFrontEndDataToBibleData = (bibleData: BibleBook[]) => {
    bibleData.forEach((book) => {
        book.contents.forEach((content) => {
            content.expanded = false;
            content.selected = false;
            content.textSelected = false;
            content.audioUrls.chapters.forEach((chapter) => {
                chapter.selected = false;
            });
        });
    });
};

export const removeSpecialCharactersAndSpaces = (inputString: string) => {
    return inputString.replace(/[^a-zA-Z0-9]/g, '');
};
