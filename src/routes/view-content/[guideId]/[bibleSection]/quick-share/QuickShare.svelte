<script lang="ts">
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import { qr } from '@svelte-put/qr/svg';
    import { _ as translate } from 'svelte-i18n';

    export let close: () => void;
</script>

<div class="flex flex-col p-4 pb-24">
    <div class="my-4 flex w-full justify-end">
        <button
            class="flex w-1/4 justify-end"
            on:click={close}
            data-app-insights-event-name="quick-share-close-button-clicked"
        >
            <XMarkIcon />
        </button>
    </div>

    <h1 class="mb-8 text-2xl">{$translate('page.quickShare.share.value')}</h1>

    <p class="mb-6">{$translate('page.quickShare.inAWebBrowser.value')}</p>

    <a
        class="mb-6 ms-4 underline underline-offset-2"
        href={window.location.origin}
        data-app-insights-event-name="quick-share-link-clicked">{window.location.hostname}</a
    >

    <p class="mb-2">{$translate('page.quickShare.orScan.value')}</p>

    <div class="mb-6 max-h-96 max-w-96 px-2">
        <svg
            use:qr={{
                data: window.location.origin,
                logo: '/bibleWellLogoWithText-568.png',
                shape: 'square',
            }}
        />
    </div>

    <p class="mb-6">{$translate('page.quickShare.toInstallBibleWell.value')}</p>

    <ol role="list">
        <li class="ms-4">{$translate('page.quickShare.stepOne.value')}</li>
        <li class="ms-4">
            {$translate('page.quickShare.stepTwo.value')}
            <a
                class="underline underline-offset-2"
                href={window.location.origin}
                data-app-insights-event-name="quick-share-link-clicked">{window.location.hostname}</a
            >
        </li>
        <li class="ms-4">{$translate('page.quickShare.stepThree.value')}</li>
        <li class="ms-4">{$translate('page.quickShare.stepFour.value')}</li>
    </ol>
    <div id="bible-well-share-image" class="mx-auto my-6 flex h-auto w-full max-w-xs">
        <img class="object-contain" src="/bibleWellShareImage.png" alt="Bible Well Share Image" aria-hidden="true" />
    </div>

    <button
        class="btn btn-primary mx-auto w-2/4"
        on:click={close}
        data-app-insights-event-name="quick-share-close-button-clicked"
        >{$translate('page.quickShare.close.value')}</button
    >
</div>
