export interface ImageOrVideoResource {
    type: 'image' | 'video';
    displayName: string | null;
    url: string;
    duration?: number;
    thumbnailUrl?: string;
}

export interface TextResource {
    displayName: string | null;
    html: string;
    preview: string;
}
