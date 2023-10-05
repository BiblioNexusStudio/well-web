<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import refresh from 'svelte-awesome/icons/refresh';
    import { Icon } from 'svelte-awesome';

    export let show: boolean;
    export let onUpdate: (() => void) | null;

    let isRefreshing = false;

    function update() {
        isRefreshing = true;
        onUpdate && onUpdate();
    }

    function close() {
        show = false;
    }
</script>

<dialog class="modal" open={show}>
    <div class="modal-box">
        {$translate('updateAppModal.message.value')}
        <div class="modal-action">
            <button class="btn" on:click={close}>{$translate('updateAppModal.dismiss.value')}</button>
            <button class="btn" on:click={update}
                >{$translate('updateAppModal.update.value')}
                {#if isRefreshing}
                    <Icon data={refresh} spin />
                {/if}
            </button>
        </div>
    </div>
</dialog>
