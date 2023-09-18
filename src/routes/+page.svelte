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
        <div class="flex w-full max-w-xs mx-auto px-6 pb-4">
            <div id="bible-well-logo" class="flex w-16 h-auto mr-6">
                <img src="/logo.svg" alt="Bible Well Logo" />
            </div>
            <div class="flex flex-col">
                <div class="text-left text-primary text-2xl pb-2">The</div>
                <h1 class="text-left font-semibold text-primary text-4xl pb-2">Bible Well</h1>
            </div>
        </div>
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
