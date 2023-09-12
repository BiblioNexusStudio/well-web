<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { goto } from '$app/navigation';
    import PassageForm from '$lib/components/PassageForm.svelte';
    import { isOnline } from '$lib/stores/is-online.store';

    const goToFileManager = () => {
        goto('/file-manager');
    };
</script>

<section class="container mx-auto flex h-screen">
    <div class="flex flex-col flex-grow self-center">
        <h1 class="text-center font-semibold text-primary text-7xl pb-4">AQUIFER</h1>
        <h2 class="text-center font-semibold text-slate-400 text-xl pb-4 max-w-xs mx-auto">
            {$translate('page.index.subTitle.value')}
        </h2>
        <PassageForm />
        <button class="mt-6 mx-auto text-sky-500 max-w-xs" on:click|preventDefault={goToFileManager}
            >{$isOnline
                ? $translate('page.index.downloadResourcesForOfflineUse.value')
                : $translate('sideMenu.fileManager.value')}</button
        >
    </div>
</section>
