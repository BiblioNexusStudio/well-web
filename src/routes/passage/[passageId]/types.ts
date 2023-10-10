export interface ImageResource {
    isImage: true;
    displayName: string | null;
    url: string;
}

export interface TextResource {
    displayName: string | null;
    html: string;
    preview: string;
}
