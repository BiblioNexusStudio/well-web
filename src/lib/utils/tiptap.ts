import type { AssociatedResource } from '$lib/types/resource';
import {
    Link,
    Mark,
    Node as TiptapNode,
    configureAndOverrideExtensions,
    customExtensions,
    generateHTML,
    officialMarks,
    officialNodes,
} from 'aquifer-tiptap';
import type { ContentTabEnum } from '../../routes/view-content/[guideId]/[bibleSection]/context';
import { DirectionCode, handleRtlVerseReferences } from './language-utils';
import ResourceReference from './tiptap-extensions/resource-reference';

const NODE_TYPE = new TiptapNode().type;
const MARK_TYPE = new Mark().type;

const nodes = [...officialNodes, ...customExtensions.filter((e) => e.type === NODE_TYPE)];
const knownNodeNames = nodes.map((n) => n.name);

const marks = [
    ...officialMarks.filter((m) => m.name !== Link.name),
    ...customExtensions.filter((e) => e.type === MARK_TYPE),
];
const knownMarkNames = marks.map((m) => m.name);

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
        ...configureAndOverrideExtensions(nodes, []),
        ...configureAndOverrideExtensions(marks, [ResourceReference.configure({ tab, availableAssociatedResources })]),
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
    scriptDirection: DirectionCode | undefined,
    tab: ContentTabEnum,
    availableAssociatedResources: AssociatedResource[] | undefined
) {
    const tiptapJson =
        scriptDirection === DirectionCode.RTL
            ? JSON.parse(handleRtlVerseReferences(JSON.stringify(json), scriptDirection)!)
            : (json as BasicTiptapJson);
    return generateHTML(
        {
            ...json,
            content: filterKnownNodes(tiptapJson.content),
        },
        generateExtensions(tiptapJson, tab, availableAssociatedResources)
    );
}
