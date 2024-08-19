<script lang="ts">
    import type { BaseBible } from '$lib/types/bible';
    import { acceptBibleLicense } from '$lib/utils/bible-license-handler';
    import { _ as translate } from 'svelte-i18n';

    export let bible: BaseBible | null;

    let modal: HTMLDialogElement | undefined = undefined;

    $: !!bible && modal?.show();
    $: licenseType = bible?.licenseInfo?.licenses.map((l) => l.eng!.name).join(' and ');

    function acceptLicense() {
        if (bible) {
            acceptBibleLicense(bible);
            modal?.close();
        }
    }
</script>

<dialog on:close={() => (bible = null)} bind:this={modal} class="modal">
    <form class="modal-box">
        <h3 class="text-lg font-bold">{$translate('page.bibleMenu.bibleLicenseAcceptanceModal.header.value')}</h3>
        <div class="divider" />
        <p class="mb-6">
            {$translate('page.bibleMenu.bibleLicenseAcceptanceModal.description.value', {
                values: {
                    resourceName: `${bible?.name} (${bible?.abbreviation})`,
                    licenseType,
                },
            })}
        </p>
        <div class="flex justify-end space-x-2">
            <button
                class="btn"
                on:click|stopPropagation={() => modal?.close()}
                data-app-insights-event-name="bible-license-acceptance-modal-cancel-button-clicked"
                >{$translate('page.bibleMenu.bibleLicenseAcceptanceModal.cancel.value')}</button
            >
            <button
                class="btn btn-primary"
                on:click|stopPropagation={acceptLicense}
                data-app-insights-dimensions={`bibleName,${bible?.name}`}
                data-app-insights-event-name="bible-license-acceptance-modal-accept-button-clicked"
                >{$translate('page.bibleMenu.bibleLicenseAcceptanceModal.accept.value')}</button
            >
        </div>
    </form>
    <form method="dialog" class="modal-backdrop">
        <button on:click|stopPropagation data-app-insights-event-name="bible-license-acceptance-modal-close-clicked"
            >close</button
        >
    </form>
</dialog>
