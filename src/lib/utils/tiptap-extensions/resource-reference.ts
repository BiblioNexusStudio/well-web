import { MediaType, type AssociatedResource } from '$lib/types/resource';
import type { ContentTabEnum } from '../../../routes/view-content/[guideId]/[bibleSection]/context';
import { ResourceReference } from 'aquifer-tiptap';

export default ResourceReference.extend<ResourceReferenceOptions>({
    addOptions() {
        return {
            ...this.parent?.(),
            availableAssociatedResources: undefined,
            tab: undefined,
        };
    },
    renderHTML(args) {
        const { HTMLAttributes } = args;
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
            return this.parent?.(args) ?? ['span', 0];
        }
    },
});

interface ResourceReferenceOptions {
    availableAssociatedResources: AssociatedResource[] | undefined;
    tab: ContentTabEnum | undefined;
}
