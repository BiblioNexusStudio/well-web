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
