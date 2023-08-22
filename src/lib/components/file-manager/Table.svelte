<script lang="ts">
    import { tableType } from '$lib/stores/file-manager.store';
    import BibleTable from '$lib/components/file-manager/BibleTable.svelte';
    import ResourcesTable from '$lib/components/file-manager/ResourcesTable.svelte';
</script>

{#if $tableType === 'bible'}
    <BibleTable />
{:else}
    <ResourcesTable />
{/if}