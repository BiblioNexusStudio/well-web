<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import searchIcon from 'svelte-awesome/icons/search';
    import { _ as translate } from 'svelte-i18n';

    export let searchQuery: string;
</script>

<div class="relative">
    <div class="absolute left-4 flex h-full items-center">
        <Icon class="stroke-base-content" data={searchIcon} />
    </div>
    <div class="absolute right-4 flex h-full items-center {searchQuery === '' && 'hidden'}">
        <button class="text-sm font-medium text-secondary-content underline" on:click={() => (searchQuery = '')}>
            {$translate('components.search.clear.value')}
        </button>
    </div>
    <input
        class="input input-bordered w-full ps-10"
        placeholder={$translate('components.search.placeholder.value')}
        bind:value={searchQuery}
    />
</div>
