<script lang="ts">
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import { openMainMenu } from '$lib/stores/passage-page.store';
    import { qr } from '@svelte-put/qr/svg';
</script>

<div class="flex flex-col p-4 pb-24">
    <div class="my-4 flex w-full justify-end">
        <button
            class="flex w-1/4 justify-end"
            on:click={openMainMenu}
            data-app-insights-event-name="quick-share-close-button-clicked"
        >
            <XMarkIcon />
        </button>
    </div>

    <h1 class="mb-8 text-2xl">Share</h1>

    <p class="mb-6">In a web browser (like Chrome), navigate to:</p>

    <a
        class="mb-6 ms-4 underline underline-offset-2"
        href="https://app.well.bible"
        data-app-insights-event-name="quick-share-link-clicked">app.well.bible</a
    >

    <p class="mb-2">Or scan:</p>

    <div class="mb-6 px-2">
        <svg
            use:qr={{
                data: 'https://app.well.bible',
                logo: '/bibleWellLogoWithText-568.png',
                shape: 'square',
            }}
        />
    </div>

    <p class="mb-6">To install Bible Well:</p>

    <ol role="list">
        <li class="ms-4">1. Open a web browser (like Chrome)</li>
        <li class="ms-4">
            2. Navigate to <a
                class="underline underline-offset-2"
                href="https://app.well.bible"
                data-app-insights-event-name="quick-share-link-clicked">app.well.bible</a
            >
        </li>
        <li class="ms-4">3. Go to Settings</li>
        <li class="ms-4">4. Click "Install" (see below)</li>
    </ol>
    <div id="bible-well-share-image" class="mx-auto my-6 flex h-auto w-full max-w-xs">
        <img class="object-contain" src="/bibleWellShareImage.png" alt="Bible Well Share Image" aria-hidden="true" />
    </div>

    <button
        class="btn btn-primary mx-auto w-2/4"
        on:click={openMainMenu}
        data-app-insights-event-name="quick-share-close-button-clicked">Close</button
    >
</div>
