import type { AssociatedResource } from '$lib/types/resource';
import { Mark } from '@tiptap/core';

export const resourceReferenceMark = Mark.create<ResourceReferenceOptions>({
    name: 'resourceReference',
    priority: 1001,
    keepOnSplit: false,
    addAttributes() {
        return {
            resourceId: {
                default: null,
            },
        };
    },
    renderHTML({ HTMLAttributes }) {
        const associatedResourceInfo = this.options.availableAssociatedResources?.find(
            (ar) =>
                ar.externalId === HTMLAttributes.resourceId || ar.resourceId.toString() === HTMLAttributes.resourceId
        );
        if (associatedResourceInfo) {
            return [
                'button',
                {
                    class: 'btn-link',
                    onClick: `onResourceReferenceClick(${associatedResourceInfo.contentId})`,
                },
                0,
            ];
        } else {
            return ['span', 0];
        }
    },
});

interface ResourceReferenceOptions {
    availableAssociatedResources: AssociatedResource[] | undefined;
}
