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
