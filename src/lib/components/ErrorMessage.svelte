<script lang="ts">
    import { goto } from '$app/navigation';
    import { _ as translate } from 'svelte-i18n';
    import { isOnline } from '$lib/stores/is-online.store';

    export let message: string;

    const refresh = () => {
        window.location.reload();
    };
    const home = () => {
        goto('/');
    };
</script>

<div class="flex justify-center items-center h-full">
    <div class="h-auto w-full mx-6">
        <div class="bg-primary text-white font-bold rounded-t px-4 py-2">{$translate('errorMessage.error.value')}</div>
        <div class="bg-white border-2 border-primary p-4">
            <p class="font-bold mb-6">
                {$translate('errorMessage.networkStatus.value')}
                {$isOnline ? $translate('errorMessage.online.value') : $translate('errorMessage.offline.value')}
            </p>
            <p class="font-bold text mb-4">{$translate('errorMessage.title.value')}</p>
            <p class="mb-4">{message}</p>
            <div class="flex justify-end items-center">
                <button class="btn btn-secondary" on:click={home}>{$translate('errorMessage.home.value')}</button>
                <button class="btn btn-primary ml-4" on:click={refresh}
                    >{$translate('errorMessage.refresh.value')}</button
                >
            </div>
        </div>
    </div>
</div>
