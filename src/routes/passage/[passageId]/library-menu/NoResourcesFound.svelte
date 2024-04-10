<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import search from 'svelte-awesome/icons/search';
    import { _ as translate } from 'svelte-i18n';

    export let searchQuery: string;
</script>

<div class="flex flex-grow flex-col items-center justify-items-center overflow-y-scroll">
    <div class="flex-grow" />
    <div class="mt-4 flex h-12 w-12 flex-shrink-0 items-center rounded-full bg-gray-50">
        <Icon class="-ms-0.5 flex-grow stroke-neutral text-center" data={search} />
    </div>
    <div class="text-md flex-shrink-0 pb-1 pt-4 font-semibold text-base-content">
        {$translate('page.passage.resourcePane.noResourcesFound.header.value')}
    </div>
    <div class="mb-4 flex-shrink-0 text-sm text-neutral">
        {$translate('page.passage.resourcePane.noResourcesFound.description.value', { values: { searchQuery } })}
    </div>
    <div class="flex-grow" />
</div>
