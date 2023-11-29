import Link from '@tiptap/extension-link';
import { generateHTML } from '@tiptap/html';
import Image from '@tiptap/extension-image';
import { Mark, generateText } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextStyle from '@tiptap/extension-text-style';

const extensions = [
    StarterKit,
    Image,
    Link,
    Underline,
    Highlight,
    Subscript,
    Superscript,
    TextStyle,
    Mark.create({ name: 'bibleReference' }),
    Mark.create({ name: 'resourceReference' }),
];

interface TiptapParsingOptions {
    excludeHeader1: boolean;
}

interface BasicTiptapJson {
    content: { type: string; attrs?: { level?: number } }[];
}

export function parseTiptapJsonToHtml(
    json: object,
    { excludeHeader1 }: TiptapParsingOptions = { excludeHeader1: false }
) {
    const tiptapJson = json as BasicTiptapJson;
    return generateHTML(
        {
            ...json,
            content: tiptapJson.content.filter((c) => !excludeHeader1 || c.type !== 'heading' || c.attrs?.level !== 1),
        },
        extensions
    );
}

export function parseTiptapJsonToText(
    json: object,
    { excludeHeader1 }: TiptapParsingOptions = { excludeHeader1: false }
) {
    const tiptapJson = json as BasicTiptapJson;
    return generateText(
        {
            ...json,
            content: tiptapJson.content.filter((c) => !excludeHeader1 || c.type !== 'heading' || c.attrs?.level !== 1),
        },
        extensions
    );
}
