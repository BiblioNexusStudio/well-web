interface Param {
    key: string;
    value: string | number | undefined;
    ignoreIfEquals?: string | number;
}

export function buildQueryString(params: Param[]): string {
    const searchParams = new URLSearchParams();

    params.forEach(({ key, value, ignoreIfEquals }) => {
        if (value !== ignoreIfEquals && value !== undefined) {
            searchParams.append(key, value.toString());
        }
    });

    return searchParams.toString();
}
