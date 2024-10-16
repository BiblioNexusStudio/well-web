<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { ContactType, FormType } from '$lib/types/contact-info';
    const contactTypeLabels = {
        [ContactType.Email]: $translate('page.feedback.contactType.email.value'),
        [ContactType.Phone]: $translate('page.feedback.contactType.phone.value'),
        [ContactType.WhatsApp]: $translate('page.feedback.contactType.whatsapp.value'),
        [ContactType.Signal]: $translate('page.feedback.contactType.signal.value'),
        [ContactType.Other]: $translate('page.feedback.contactType.other.value'),
    };

    const ContactTypeOptions = Object.values(ContactType).map((v) => ({
        value: v.toString(),
        label: contactTypeLabels[v],
    }));

    export var contactType: string;
    export var contactValue: string;
    export var formType: FormType = FormType.ResourceForm;
</script>

<label for="contact-type" class="pb-1 ps-1 text-slate-600"
    >{formType === FormType.ResourceForm
        ? $translate('page.feedback.resourceFeedbackForm.contactInformation.value')
        : $translate('page.feedback.infoPromptForm.contactType.value')}</label
>
<select class="select select-bordered mb-4" bind:value={contactType}>
    <option value=""
        >{formType === FormType.ResourceForm
            ? $translate('page.feedback.resourceFeedbackForm.contactType.value')
            : $translate('page.feedback.infoPromptForm.contactType.value')}</option
    >
    {#each ContactTypeOptions as option (option.value)}
        <option value={option.value}>{option.label}</option>
    {/each}
</select>
{#if formType === FormType.ContactPromptForm}
    <label for="contact-info" class="pb-1 ps-1 text-slate-600"
        >{$translate('page.feedback.infoPromptForm.contactInformation.value')}</label
    >
{/if}
<input disabled={!contactType} bind:value={contactValue} class="input input-bordered mb-8" />
