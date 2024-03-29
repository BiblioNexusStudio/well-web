export async function asyncFilter<T>(array: T[], asyncPredicate: (element: T) => Promise<boolean>): Promise<T[]> {
    const results = await Promise.all(array.map(asyncPredicate));
    return array.filter((_, index) => results[index]);
}

export async function asyncEvery<T>(array: T[], asyncPredicate: (element: T) => Promise<boolean>): Promise<boolean> {
    const results = await Promise.all(array.map(asyncPredicate));
    return results.every(Boolean);
}

export async function asyncSome<T>(array: T[], asyncPredicate: (element: T) => Promise<boolean>): Promise<boolean> {
    const results = await Promise.all(array.map(asyncPredicate));
    return results.some(Boolean);
}

export async function asyncForEach<T>(
    array: T[],
    asyncCallback: (element: T, index: number, array: T[]) => Promise<void>
): Promise<void> {
    await Promise.all(array.map(asyncCallback));
}

export async function asyncMap<T, R>(
    array: T[],
    asyncMapper: (element: T, index: number, array: T[]) => Promise<R>
): Promise<R[]> {
    return await Promise.all(array.map(asyncMapper));
}

export async function asyncReturnFirst<T, V>(array: T[], asyncApply: (element: T) => Promise<V>): Promise<V | null> {
    for (const item of array) {
        const result = await asyncApply(item);
        if (result) return result;
    }
    return null;
}

export async function asyncReduce<T, R>(
    array: T[],
    reducer: (accumulator: R, element: T, index: number, array: T[]) => Promise<R>,
    initialValue: R
): Promise<R> {
    let acc = initialValue;
    for (let i = 0; i < array.length; i++) {
        acc = await reducer(acc, array[i]!, i, array);
    }
    return acc;
}
