<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { isOnline } from '$lib/stores/is-online.store';
    import LanguageIcon from '$lib/icons/LanguageIcon.svelte';
</script>

<section class="container mx-auto flex h-screen flex-col px-6">
    <div class="flex flex-col pt-14">
        <div id="bible-well-logo" class="flex h-auto w-full max-w-xs pb-6">
            <img class="object-contain" src="/bibleWellLogoWithText-568.png" alt="Bible Well Logo" />
        </div>
        <h2 class="text-xl font-semibold">{$translate('page.selectLanguage.welcome.value')}</h2>
    </div>
    <div class="flex grow flex-col pt-14">
        <a class="btn mb-8" href="/file-manager"
            >{$isOnline
                ? $translate('page.index.downloadResourcesForOfflineUse.value')
                : $translate('page.index.downloadManager.value')}</a
        >
        <a class="btn mb-8" href="/select-language"><LanguageIcon />{$translate('page.menu.changeLanguage.value')}</a>
        <a class="btn btn-primary" href="/view-content">{$translate('page.index.getStarted.value')}</a>
    </div>
    <div class="flex">
        <a class="mx-auto my-6 max-w-xs text-sky-500" href="/about">{$translate('page.index.about.value')}</a>
    </div>
</section>
