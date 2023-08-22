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
