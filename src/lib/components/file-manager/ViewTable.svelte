<script lang="ts">
    import ViewHeader from './ViewHeader.svelte';
    import ViewRow from './ViewRow.svelte';
    import mockBibleData from './mock-data.json';
    import { changeMenuGroupValue, resourcesMenu } from '$lib/stores/file-manager.store';
    import type { ResourcesMenuItem } from '$lib/types/file-manager';

    $: getViewTableData($changeMenuGroupValue, $resourcesMenu);

    function getViewTableData(view: string, resourcesMenu: ResourcesMenuItem[]) {
        // Logic Placeholder for getting data from API
        // Currently, the data is mocked
        // But the wiring from the change view menu is working.
        console.log(view);
        console.log(resourcesMenu);
    }
</script>

<table class="w-full">
    <ViewHeader />
    <tbody>
        {#each mockBibleData as bookViewRow}
            <ViewRow
                resourceName={bookViewRow.book}
                numberOfResources={bookViewRow.resources}
                size={bookViewRow.size}
                hasText={bookViewRow.text}
                hasAudio={bookViewRow.audio}
                hasMedia={bookViewRow.media}
            />
        {/each}
    </tbody>
</table>
