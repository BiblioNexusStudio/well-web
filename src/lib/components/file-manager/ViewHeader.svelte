<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import arrowDown from 'svelte-awesome/icons/arrowDown';
    import { _ as translate } from 'svelte-i18n';
</script>

<thead>
    <tr class="w-full h-16 border-y-2">
        <th>
            <input type="checkbox" class="checkbox mx-2" id="select-all-resources" />
        </th>
        <th class="text-start text-xs">
            {$translate('page.fileManager.viewHeader.name.value')}
            <Icon data={arrowDown} />
        </th>
        <th class="text-xs"> {$translate('page.fileManager.viewHeader.text.value')} </th>
        <th class="text-xs"> {$translate('page.fileManager.viewHeader.audio.value')} </th>
        <th class="text-xs"> {$translate('page.fileManager.viewHeader.media.value')} </th>
    </tr>
</thead>
