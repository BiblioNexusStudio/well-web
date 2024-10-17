<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import { apiUrl } from '$lib/data-cache';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { getAdditionalProperties } from '$lib/logger';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    import ContactOptions from './ContactOptions.svelte';
    import { trapFocus } from '$lib/utils/trap-focus';
    import { FeedbackType, FormType } from '$lib/types/contact-info';
    import { isOnline } from '$lib/stores/is-online.store';

    export let close: () => void;
    export let isOpen: boolean;

    let loading = false;
    let submitDisabled = true;
    let name = '';
    let contactType = '';
    let contactValue = '';
    let showError = false;
    let showOfflineSuccess = false;
    let showSuccess = false;

    $: !contactType && (contactValue = '');

    $: name && contactValue && contactType ? (submitDisabled = false) : (submitDisabled = true);

    function resetForm() {
        loading = false;
        showSuccess = false;
        showOfflineSuccess = false;
        showError = false;
        contactType = '';
        contactValue = '';
    }

    async function handleSubmit() {
        loading = true;
        const metaData = {
            additionalProperties: getAdditionalProperties(),
            currentLanguage: {
                ...$currentLanguageInfo,
            },
        };

        const postData = {
            name,
            contactType: contactType,
            contactValue: contactValue,
            feedback: JSON.stringify(metaData),
            feedbackType: FeedbackType.PromptFeedbackForm,
        };

        let response;
        try {
            response = await fetch(apiUrl('feedback/bible-well'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                throw new Error('Failed to send feedback');
            }

            loading = false;
            localStorage.setItem('user-info-collected', 'true');
        } catch (error) {
            if (!$isOnline) {
                // if the user is offline, the BackgroundSync will handle sending when they come back online
                showOfflineSuccess = true;
                localStorage.setItem('user-info-collected', 'true');
            }
            loading = false;
        } finally {
            loading = false;
        }
        if (response && response.ok) {
            resetForm();
            showSuccess = true;
        } else {
            showError = true;
        }
    }
</script>

<dialog use:trapFocus={isOpen} on:close={close} open={isOpen} class="modal">
    <div class="modal-box mb-auto mt-auto">
        {#if loading}
            <h2 class="mb-8 text-center text-lg font-bold">{$translate('page.feedback.feedbackSending.value')}</h2>
            <FullPageSpinner height={'h-26'} />
        {:else if showSuccess || showOfflineSuccess}
            <div class="flex flex-col items-center">
                <h2 class="mb-8 text-center text-lg font-bold">
                    {#if showSuccess}
                        {$translate('page.feedback.feedbackSuccessfullySent.value')}
                    {:else}
                        {$translate('page.feedback.feedbackQueuedOffline.value')}
                    {/if}
                </h2>
                <h2 class="mb-8 text-lg font-bold">{$translate('page.feedback.thankYou.value')}</h2>
            </div>
            <button class="btn btn-primary" on:click={close}>{$translate('page.feedback.close.value')}</button>
        {:else}
            <div class="flex h-full flex-col">
                <div class="flex w-full items-center justify-end">
                    <button on:click={close}>
                        <XMarkIcon />
                    </button>
                </div>
                <div class="mb-4 flex w-full items-center justify-center">
                    <h1 class="text-2xl font-bold text-slate-600">
                        {$translate('page.feedback.infoPromptForm.share.value')}
                    </h1>
                </div>
                <hr class="mb-4 w-full" />
                <div class="mb-4">
                    {$translate('page.feedback.infoPromptForm.shareSubtitle.value')}
                </div>

                <form on:submit|preventDefault={handleSubmit} class="flex flex-col px-4">
                    <label for="name" class="mb-2 ps-1 text-slate-600"
                        >{$translate('page.feedback.feedbackForm.name.value')}</label
                    >
                    <input bind:value={name} name="name" class="mb-4 rounded-xl border p-2 focus:outline-none" />
                    <ContactOptions bind:contactType bind:contactValue formType={FormType.ContactPromptForm} />
                    <div class="flex w-full justify-center">
                        <button
                            disabled={submitDisabled}
                            type="submit"
                            class="btn btn-primary w-full"
                            data-app-insights-event-name="feedback-menu-submit-button-click"
                            >{$translate('page.feedback.submit.value')}</button
                        >
                    </div>
                    {#if showError}
                        <h2 class="text-md pt-3 text-center font-bold text-error">
                            {$translate('page.feedback.feedbackError.value')}
                        </h2>
                    {/if}
                </form>
            </div>
        {/if}
    </div>
</dialog>
