import type { StepBasedGuideStep } from '$lib/types/resource';

export function filterStepsOnSettingChanges<T extends StepBasedGuideStep>(
    steps: T[],
    filterAiBool: boolean,
    filterCommunityBool: boolean
) {
    return steps.filter((step) => {
        if (step.aiEdition) {
            return filterAiBool;
        } else if (step.communityEdition) {
            return filterCommunityBool;
        }
        return true;
    });
}
