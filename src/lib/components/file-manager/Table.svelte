<script lang="ts">
    import { tableType, selectedBookId } from '$lib/stores/file-manager.store';
    import BibleTable from '$lib/components/file-manager/BibleTable.svelte';
    import ResourcesTable from '$lib/components/file-manager/ResourcesTable.svelte';
    import { featureFlags } from '$lib/stores/feature-flags.store';
    import ViewTable from './ViewTable.svelte';
</script>

{#if !$featureFlags.newFileManager}
    {#if $tableType === 'bible'}
        <BibleTable />
    {:else}
        <ResourcesTable />
    {/if}
{:else if $selectedBookId}
    <ViewTable />
{/if}
