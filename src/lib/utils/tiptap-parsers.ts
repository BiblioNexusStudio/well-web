import { generateHTML } from '@tiptap/html';
import { Mark } from '@tiptap/core';
import { resourceReferenceMark } from './tiptap/resourceReferenceMark';
import type { AssociatedResource } from '$lib/types/resource';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlock from '@tiptap/extension-code-block';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Image from '@tiptap/extension-image';
import Bold from '@tiptap/extension-bold';
import Code from '@tiptap/extension-code';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextStyle from '@tiptap/extension-text-style';
import { Video } from './tiptap/video';
import type { ContentTabEnum } from '../../routes/view-content/[guideId]/[bibleSection]/context';

const nodes = [
    Blockquote,
    Document,
    BulletList,
    CodeBlock,
    HardBreak,
    Heading,
    HorizontalRule,
    ListItem,
    OrderedList,
    Paragraph,
    Text,
    Image,
    Video,
];
const knownNodeNames = nodes.map((n) => n.name);

const marks = [Bold, Code, Italic, Strike, Underline, Highlight, Subscript, Superscript, TextStyle];
const knownMarkNames = marks.map((m) => m.name).concat([resourceReferenceMark.name]);

interface BasicTiptapJson {
    content: Node[];
}

interface Node {
    type: string;
    content?: Node[];
    attrs?: { level?: number };
    marks?: { type: string }[];
}

function findUnknownMarks(node: Node): string[] {
    const unknownMarks = (node.marks || [])
        .filter((mark) => !knownMarkNames.includes(mark.type))
        .map((mark) => mark.type);

    if (node.content) {
        return [...unknownMarks, ...node.content.flatMap(findUnknownMarks)];
    }

    return unknownMarks;
}

function generateExtensions(
    tiptapJson: BasicTiptapJson,
    tab: ContentTabEnum,
    availableAssociatedResources: AssociatedResource[] | undefined
) {
    const unknownMarkNames = [...new Set(tiptapJson.content.flatMap(findUnknownMarks))];

    return [
        ...marks.map((m) => m.configure({})),
        ...nodes.map((n) => n.configure({})),
        resourceReferenceMark.configure({ tab, availableAssociatedResources }),
        ...unknownMarkNames.map((name) => Mark.create({ name })),
    ];
}

function filterKnownNodes(nodes: Node[]): Node[] {
    const filteredNodes: Node[] = [];
    for (const node of nodes) {
        if (knownNodeNames.includes(node.type)) {
            if (node.content) {
                node.content = filterKnownNodes(node.content);
            }
            filteredNodes.push(node);
        }
    }
    return filteredNodes;
}

export function parseTiptapJsonToHtml(
    json: object,
    tab: ContentTabEnum,
    availableAssociatedResources: AssociatedResource[] | undefined
) {
    const tiptapJson = json as BasicTiptapJson;
    return generateHTML(
        {
            ...json,
            content: filterKnownNodes(tiptapJson.content),
        },
        generateExtensions(tiptapJson, tab, availableAssociatedResources)
    );
}
