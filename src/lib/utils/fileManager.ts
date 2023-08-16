export const convertToReadableSize = (size: number) => {
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;

    const bytes = size * 1024;

    if (isNaN(bytes)) {
        return 'Invalid input';
    }

    if (bytes < mb) {
        return `${bytes / kb} KB`;
    } else if (bytes < gb) {
        return `${(bytes / mb).toFixed(2)} MB`;
    } else {
        return `${(bytes / gb).toFixed(2)} GB`;
    }
};
