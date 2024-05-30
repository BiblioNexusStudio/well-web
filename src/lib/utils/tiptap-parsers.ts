import { generateHTML } from '@tiptap/html';
import Image from '@tiptap/extension-image';
import { Mark } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextStyle from '@tiptap/extension-text-style';
import { resourceReferenceMark } from './tiptap/resourceReferenceMark';
import type { AssociatedResource } from '$lib/types/resource';

function generateExtensions(availableAssociatedResources: AssociatedResource[] | undefined) {
    // some Mark types we don't care about from an end user perspective
    const ignoredMarks = [
        Mark.create({ name: 'bibleReference' }),
        Mark.create({ name: 'link' }),
        Mark.create({ name: 'comments' }),
    ];

    return [
        StarterKit.configure({}),
        Image.configure({}),
        Underline.configure({}),
        Highlight.configure({}),
        Subscript.configure({}),
        Superscript.configure({}),
        TextStyle.configure({}),
        resourceReferenceMark.configure({ availableAssociatedResources }),
        ...ignoredMarks,
    ];
}

interface BasicTiptapJson {
    content: { type: string; attrs?: { level?: number } }[];
}

export function parseTiptapJsonToHtml(json: object, availableAssociatedResources: AssociatedResource[] | undefined) {
    const tiptapJson = json as BasicTiptapJson;
    return generateHTML(
        {
            ...json,
            content: tiptapJson.content,
        },
        generateExtensions(availableAssociatedResources)
    );
}
