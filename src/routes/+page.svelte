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
    <div class="flex flex-grow flex-col self-center">
        <div class="mx-auto flex w-full max-w-xs px-6 pb-4">
            <div id="bible-well-logo" class="mr-6 flex h-auto w-16">
                <img src="/logo.svg" alt="Bible Well Logo" />
            </div>
            <div class="flex flex-col">
                <div class="pb-2 text-left text-2xl text-primary">The</div>
                <h1 class="pb-2 text-left text-4xl font-semibold text-primary">Bible Well</h1>
            </div>
        </div>
        <h2 class="mx-auto max-w-xs pb-4 text-center text-xl font-semibold text-slate-400">
            {$translate('page.index.subTitle.value')}
        </h2>
        <PassageForm />
        <button class="mx-auto mt-6 max-w-xs text-sky-500" on:click|preventDefault={goToFileManager}
            >{$isOnline
                ? $translate('page.index.downloadResourcesForOfflineUse.value')
                : $translate('sideMenu.fileManager.value')}</button
        >
    </div>
</section>
