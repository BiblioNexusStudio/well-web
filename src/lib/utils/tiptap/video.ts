// taken from https://github.com/sereneinserenade/tiptap-extension-video
import { Node } from '@tiptap/core';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        video: {
            setVideo: (src: string) => ReturnType;
            toggleVideo: (src: string) => ReturnType;
        };
    }
}

export const Video = Node.create({
    name: 'video',

    group: 'block',

    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: (el: HTMLSpanElement) => (el as HTMLSpanElement).getAttribute('src'),
                renderHTML: (attrs) => ({ src: attrs.src }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'video',
                getAttrs: (el) => ({ src: (el as HTMLVideoElement).getAttribute('src') }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['video', { controls: 'true', style: 'width: 100%', ...HTMLAttributes }, ['source', HTMLAttributes]];
    },
});
