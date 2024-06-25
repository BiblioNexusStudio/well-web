export function objectValues<T>(obj: T): T[keyof T][] {
    return Object.values(obj as object) as T[keyof T][];
}

export function objectKeys<T>(obj: T): (keyof T)[] {
    return Object.keys(obj as object).map((key) => (isNaN(Number(key)) ? key : Number(key))) as (keyof T)[];
}

export function objectEntries<T>(obj: T): [keyof T, T[keyof T]][] {
    return Object.entries(obj as object) as [keyof T, T[keyof T]][];
}
