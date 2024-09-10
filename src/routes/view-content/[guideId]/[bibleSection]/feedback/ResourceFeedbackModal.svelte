<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import { apiUrl } from '$lib/data-cache';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { ContactType, getResourceFeedbackContext } from '../resource-feedback-context';
    import StarRating from '$lib/components/StarRating.svelte';
    import { isOnline } from '$lib/stores/is-online.store';
    import { trapFocus } from '$lib/utils/trap-focus';

    const { modalIsOpenForResourceContentId, contactInfo, saveContactInfo, closeResourceFeedbackModal } =
        getResourceFeedbackContext();

    let loading = false;
    let showSuccess = false;
    let showOfflineSuccess = false;
    let showError = false;
    let additionalFeedback = '';
    let contactType = '';
    let contactValue = '';
    let rating = 0;

    const contactTypeOptions = Object.values(ContactType).map((v) => v.toString());

    function resetForm() {
        loading = false;
        showSuccess = false;
        showOfflineSuccess = false;
        showError = false;
        additionalFeedback = '';
        contactType = '';
        contactValue = '';
        rating = 0;
    }

    function close() {
        resetForm();
        closeResourceFeedbackModal();
    }

    async function handleSubmit() {
        loading = true;
        showError = false;

        const contentId = $modalIsOpenForResourceContentId!;
        const version = (await window.__CACHING_CONFIG.contentIdAndVersionDb.get(contentId))?.version;

        const postData = {
            contentId,
            version: version ? version : null,
            contactType: contactType ? contactType : null,
            contactValue: contactValue ? contactValue : null,
            feedback: additionalFeedback ? additionalFeedback : null,
            userRating: rating,
        };

        let response;
        try {
            response = await fetch(apiUrl('feedback/resources/content'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(postData),
            });
        } catch (error) {
            if (!$isOnline) {
                // if the user is offline, the BackgroundSync will handle sending when they come back online
                showOfflineSuccess = true;
            } else {
                showError = true;
            }
        } finally {
            loading = false;
        }

        if (response && response.ok) {
            if (contactValue && contactType) {
                saveContactInfo({ contactType: contactType as ContactType, contactValue });
            }
            resetForm();
            showSuccess = true;
        } else {
            showError = true;
        }
    }
</script>

<dialog
    use:trapFocus={!!$modalIsOpenForResourceContentId}
    on:close={close}
    open={!!$modalIsOpenForResourceContentId}
    class="modal"
>
    <div class="modal-box mb-auto mt-16">
        <div class="flex h-full flex-col items-center justify-center">
            <div class="mb-4 flex w-full items-center justify-between">
                <h1 class="text-2xl font-bold text-slate-600">{$translate('page.feedback.feedback.value')}</h1>
                <button on:click={close}>
                    <XMarkIcon />
                </button>
            </div>

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
                <div class="flex flex-col px-4">
                    <h3 class="self-center pb-2 text-sm text-slate-600">
                        {$translate('page.feedback.resourceFeedbackForm.rateContent.value')}
                    </h3>
                    <div class="self-center pb-6">
                        <StarRating bind:rating />
                    </div>

                    <label for="additional" class="pb-1 ps-1 text-slate-600"
                        >{$translate('page.feedback.resourceFeedbackForm.additionalFeedback.value')}</label
                    >
                    <textarea
                        name="additional"
                        maxlength="250"
                        bind:value={additionalFeedback}
                        class="textarea textarea-bordered mb-4 min-h-36"
                    ></textarea>

                    {#if !$contactInfo}
                        <label for="contact-type" class="pb-1 ps-1 text-slate-600"
                            >{$translate('page.feedback.resourceFeedbackForm.contactInformation.value')}</label
                        >
                        <select class="select select-bordered mb-2" bind:value={contactType}>
                            <option value=""
                                >{$translate('page.feedback.resourceFeedbackForm.contactType.value')}</option
                            >
                            {#each contactTypeOptions as option (option)}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                        <input bind:value={contactValue} class="input input-bordered mb-4" />
                    {/if}

                    <div class="flex w-full justify-end">
                        <button disabled={rating === 0} on:click={handleSubmit} class="btn btn-primary w-full"
                            >{$translate('page.feedback.submit.value')}</button
                        >
                    </div>
                    {#if showError}
                        <h2 class="text-md pt-3 text-center font-bold text-error">
                            {$translate('page.feedback.feedbackError.value')}
                        </h2>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
