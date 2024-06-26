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

// Filter out falsey values from an array (e.g. null, undefined, false, 0, "").
export function filterBoolean<T>(items: (T | undefined | null)[] | undefined | null): T[] {
    if (items === null || items === undefined) {
        return [] as T[];
    }
    return items.filter(Boolean) as T[];
}

// Filter out elements in an array where the values at a given key are falsey (e.g. null, undefined, false, 0, "").
export function filterBooleanByKey<T, K extends keyof T>(
    items: (T | undefined | null)[] | undefined | null,
    key: K
): (T & { [P in K]: NonNullable<T[P]> })[] {
    if (items === null || items === undefined) {
        return [] as (T & { [P in K]: NonNullable<T[P]> })[];
    }
    return items.filter((item): item is T & { [P in K]: NonNullable<T[P]> } => {
        return Boolean(item?.[key]);
    });
}
