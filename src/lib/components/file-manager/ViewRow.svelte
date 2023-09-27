<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import pictureO from 'svelte-awesome/icons/pictureO';
    import { _ as translate } from 'svelte-i18n';

    export let resourceName = 'Genesis';
    export let numberOfResources = 5;
    export let size = '3.65 MB';
    export let hasText = false;
    export let hasAudio = false;
    export let hasMedia = false;
</script>

<tr class="w-full h-16 border-b-2 odd:bg-gray-100">
    <td class="text-center">
        <input type="checkbox" class="checkbox checkbox-primary mx-2" />
    </td>

    <td>
        <div class="font-bold">{resourceName}</div>
        <div>{numberOfResources} {$translate('page.fileManager.viewRow.resources.value')} | {size}</div>
    </td>
    <td class="text-center">
        {#if hasText}
            <Icon data={fileTextO} />
        {/if}
    </td>
    <td class="text-center">
        {#if hasAudio}
            <Icon data={volumeUp} />
        {/if}
    </td>
    <td class="text-center">
        {#if hasMedia}
            <Icon data={pictureO} />
        {/if}
    </td>
</tr>
