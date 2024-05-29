<script lang="ts">
    import type { LibraryResourceGrouping } from '../library-resource-loader';
    import { parseSubtitle, parseTitle } from './titles';

    export let isVisible = true;
    export let resourceGrouping: LibraryResourceGrouping;

    $: title = parseTitle(resourceGrouping.parentResource.displayName);
    $: subtitle = parseSubtitle(resourceGrouping.parentResource.displayName);
</script>

<div class={isVisible ? 'visible' : 'hidden'}>
    <div class="flex pb-4 pt-4">
        <div class="text-md font-semibold text-blue-title">
            {title}
        </div>
        <div class="font-sans-serif flex items-end pb-[1px] ps-1 text-sm font-light text-base-700 opacity-50">
            {subtitle ?? ''}
        </div>

        <div class="flex-grow"></div>
        <slot />
    </div>
</div>
