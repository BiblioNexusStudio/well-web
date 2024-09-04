import { MediaType, type AssociatedResource } from '$lib/types/resource';
import { Mark } from '@tiptap/core';
import type { ContentTabEnum } from '../../../routes/view-content/[guideId]/[bibleSection]/context';

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
                (ar.mediaType === MediaType.Text || !ar.mediaType) &&
                (ar.externalId === HTMLAttributes.resourceId || ar.resourceId.toString() === HTMLAttributes.resourceId)
        );
        const audioId = this.options.availableAssociatedResources?.find(
            (ar) => ar.mediaType === MediaType.Audio && ar.resourceId === associatedResourceInfo?.resourceId
        )?.contentId;
        if (associatedResourceInfo) {
            return [
                'button',
                {
                    class: 'btn-link',
                    onClick: `onResourceReferenceClick('${this.options.tab}', ${associatedResourceInfo.contentId}, ${
                        audioId ?? 'undefined'
                    })`,
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
    tab: ContentTabEnum;
}
