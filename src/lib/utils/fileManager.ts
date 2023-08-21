import { bibleData, bibleDataClone } from '$lib/stores/file-manager.store';
import { isCachedFromCdn } from '$lib/data-cache';

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

export const addFrontEndDataToBibleData = () => {
    bibleData.update((bibleData) => {
        bibleData.forEach((book) => {
            book.contents.forEach(async (content) => {
                content.expanded = false;
                content.textSelected = await isCachedFromCdn(content.textUrl);

                content.audioUrls.chapters.forEach(async (chapter) => {
                    chapter.selected = await isCachedFromCdn(chapter.webm.url);
                });

                content.selected =
                    content.textSelected && content.audioUrls.chapters.every((chapter) => chapter.selected);
            });
        });

        return bibleData;
    });

    bibleDataClone.update((bibleDataClone) => {
        bibleData.subscribe((bibleData) => {
            bibleDataClone = structuredClone(bibleData);
        });

        return bibleDataClone;
    });
};
