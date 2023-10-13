<script lang="ts">
    import { goto } from '$app/navigation';
    import { _ as translate } from 'svelte-i18n';

    const home = () => {
        goto('/');
    };
</script>

<div class="flex h-full items-center justify-center">
    <div class="mx-6 h-auto w-full">
        <div class="rounded-t bg-primary px-4 py-2 font-bold text-white">{$translate('errorMessage.error.value')}</div>
        <div class="border-2 border-primary bg-white p-4">
            <p class="text mb-4 font-bold">{$translate('errorMessage.title.value')}</p>
            <p class="mb-4">{$translate('errorMessage.message.value')}</p>
            <div class="flex items-center justify-end">
                <button class="btn btn-primary" on:click={home}>{$translate('errorMessage.home.value')}</button>
            </div>
        </div>
    </div>
</div>
