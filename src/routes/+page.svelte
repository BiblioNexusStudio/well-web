<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import PassageForm from '$lib/components/PassageForm.svelte';
    import { isOnline } from '$lib/stores/is-online.store';
</script>

<section class="container mx-auto flex h-screen flex-col">
    <div class="flex-[2]" />
    <div class="flex flex-grow flex-col self-center">
        <div id="bible-well-logo" class="mx-auto flex h-auto w-full max-w-xs px-6 pb-4">
            <img class="object-contain" src="/bibleWellLogoWithText-568.png" alt="Bible Well Logo" />
        </div>
        <h2 class="mx-auto max-w-xs pb-4 text-center text-xl font-semibold text-slate-400">
            {$translate('page.index.subTitle.value')}
        </h2>
        <PassageForm />
        <a class="mx-auto mt-6 max-w-xs text-sky-500" href="/file-manager"
            >{$isOnline
                ? $translate('page.index.downloadResourcesForOfflineUse.value')
                : $translate('page.index.fileManager.value')}</a
        >
    </div>
    <div class="flex-[1]" />
    <a class="mx-auto my-6 max-w-xs text-sky-500" href="/about">{$translate('page.index.about.value')}</a>
</section>
