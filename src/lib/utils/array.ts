import { objectEntries } from './typesafe-standard-lib';

export function groupBy<T, K extends PropertyKey, V>(
    arr: T[],
    getKey: (item: T) => K,
    getValue: (items: T[]) => V = (items) => items as unknown as V
): Record<K, V> {
    return objectEntries(
        arr.reduce(
            (acc, item) => {
                const key = getKey(item);
                acc[key] = acc[key] || [];
                acc[key].push(item);
                return acc;
            },
            {} as Record<K, T[]>
        )
    ).reduce(
        (acc, [key, value]) => {
            acc[key] = getValue(value);
            return acc;
        },
        {} as Record<K, V>
    );
}

export function at<T>(arr: T[], index: number): T | undefined {
    const posIndex = index < 0 ? arr.length + index : index;
    return posIndex >= 0 && posIndex < arr.length ? arr[posIndex] : undefined;
}

export function range(start: number, end: number) {
    return [...Array(end - start + 1).keys()].map((n) => n + start);
}

export function chunk<T>(array: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

export function removeFromArray<T>(array: T[], value: T) {
    const index = array.indexOf(value);
    if (index > -1) array.splice(index, 1);
}

export function sortByKey<T>(items: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    return items.sort((a, b) => {
        if (a[key] > b[key]) {
            return direction === 'asc' ? 1 : -1;
        } else if (a[key] < b[key]) {
            return direction === 'asc' ? -1 : 1;
        } else {
            return 0;
        }
    });
}
