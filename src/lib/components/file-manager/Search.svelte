<script lang="ts">
    import search from 'svelte-awesome/icons/search';
    import { Icon } from 'svelte-awesome';
    import { _ as translate } from 'svelte-i18n';
</script>

<div class="flex grow items-center relative">
    <input
        class="input input-bordered pl-8 w-full mr-2"
        type="text"
        placeholder={$translate('page.fileManager.search.value')}
        aria-label={$translate('page.fileManager.search.value')}
    />
    <Icon class="absolute left-3 text-gray-400" data={search} />
</div>
