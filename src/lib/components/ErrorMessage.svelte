<script lang="ts">
    import { goto } from '$app/navigation';
    import { _ as translate } from 'svelte-i18n';

    const home = () => {
        goto('/');
    };
</script>

<div class="flex justify-center items-center h-full">
    <div class="h-auto w-full mx-6">
        <div class="bg-primary text-white font-bold rounded-t px-4 py-2">{$translate('errorMessage.error.value')}</div>
        <div class="bg-white border-2 border-primary p-4">
            <p class="font-bold text mb-4">{$translate('errorMessage.title.value')}</p>
            <p class="mb-4">{$translate('errorMessage.message.value')}</p>
            <div class="flex justify-end items-center">
                <button class="btn btn-primary" on:click={home}>{$translate('errorMessage.home.value')}</button>
            </div>
        </div>
    </div>
</div>
