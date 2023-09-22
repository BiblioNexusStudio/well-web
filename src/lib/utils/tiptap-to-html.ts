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

const extensions = [Bold, BulletList, Document, Heading, Image, Italic, Link, ListItem, OrderedList, Paragraph, Text];

export function parseTiptapJsonToHtml(json: object) {
    return generateHTML(json, extensions);
}
