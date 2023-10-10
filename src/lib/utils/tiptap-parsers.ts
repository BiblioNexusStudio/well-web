import { Heading } from '@tiptap/extension-heading';
import Italic from '@tiptap/extension-italic';
import Paragraph from '@tiptap/extension-paragraph';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Link from '@tiptap/extension-link';
import Bold from '@tiptap/extension-bold';
import { generateHTML } from '@tiptap/html';
import Image from '@tiptap/extension-image';
import { Mark, generateText } from '@tiptap/core';

const extensions = [
    Bold,
    BulletList,
    Document,
    Heading,
    Image,
    Italic,
    Link,
    ListItem,
    OrderedList,
    Paragraph,
    Text,
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
