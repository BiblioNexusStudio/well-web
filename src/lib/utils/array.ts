export function groupBy<T, K extends PropertyKey, V>(
    arr: T[],
    getKey: (item: T) => K,
    getValue: (items: T[]) => V = (items) => items as unknown as V
): Record<K, V> {
    return Object.entries(
        arr.reduce((acc, item) => {
            const key = getKey(item);
            acc[key] = acc[key] || [];
            acc[key].push(item);
            return acc;
        }, {} as Record<K, T[]>)
    ).reduce((acc, [key, value]) => {
        acc[key as K] = getValue(value as T[]);
        return acc;
    }, {} as Record<K, V>);
}