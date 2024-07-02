<script lang="ts">
    import { openMainMenu } from '$lib/stores/passage-page.store';
    import { _ as translate } from 'svelte-i18n';
    import XMarkIcon from '$lib/icons/XMarkIcon.svelte';
    import { apiUrl } from '$lib/data-cache';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { additionalProperties, getBrowserAndScreenSize } from '$lib/logger';
    import { currentLanguageInfo } from '$lib/stores/language.store';
    interface BibleUseOptions {
        name: string;
        value: string;
    }

    let loading = false;
    let showErrors = false;
    let showSuccess = false;
    let showFailure = false;
    let name = '';
    let email = '';
    let phone = '';
    let usageFrequency = '';
    let bibleUseOptions: BibleUseOptions[] = [];
    let bibleWellUses: string[] = [];
    let likes = '';
    let improvements = '';

    bibleUseOptions = [
        {
            name: $translate('page.feedback.feedbackForm.bibleTranslation.value'),
            value: 'Bible Translation',
        },
        {
            name: $translate('page.feedback.feedbackForm.sermonPreparation.value'),
            value: 'Sermon Preparation',
        },
        {
            name: $translate('page.feedback.feedbackForm.bibleStudy.value'),
            value: 'Bible Study',
        },
        {
            name: $translate('page.feedback.feedbackForm.studiesBibleSchoolSeminary.value'),
            value: 'Studies (Bible School, Seminary)',
        },
        {
            name: $translate('page.feedback.feedbackForm.Evangelism.value'),
            value: 'Evangelism',
        },
    ];

    function resetForm() {
        name = '';
        email = '';
        phone = '';
        usageFrequency = '';
        bibleWellUses = [];
        likes = '';
        improvements = '';
        showErrors = false;
    }

    async function handleSubmit() {
        if (name && (likes || improvements)) {
            loading = true;
            const metaData = {
                formData: {
                    usageFrequency,
                    bibleWellUses,
                    likes,
                    improvements,
                },
                additionalProperties: {
                    ...additionalProperties,
                },
                browserAndScreenSize: {
                    ...getBrowserAndScreenSize(),
                },
                currentLanguage: {
                    ...$currentLanguageInfo,
                },
            };

            const postData = {
                name,
                email,
                phone,
                feedback: JSON.stringify(metaData),
            };

            const url = `${apiUrl('feedback/bible-well')}?api-key=${process.env.PUBLIC_AQUIFER_API_KEY}`;

            try {
                const response = await fetch(url, {
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

                resetForm();
                loading = false;
                showSuccess = true;
            } catch (error) {
                loading = false;
                showFailure = true;
            }
        } else {
            showErrors = true;
            alert('Please fill in the required fields');
        }
    }
</script>

{#if loading}
    <div class="flex h-full flex-col items-center justify-center">
        <h2 class="mb-12 text-xl font-bold">{$translate('page.feedback.feedbackSending.value')}</h2>
        <FullPageSpinner height={'h-26'} />
    </div>
{:else if showSuccess}
    <div class="flex h-full grow flex-col items-center justify-between pb-32">
        <div class="flex w-full justify-end pe-8">
            <button
                class="my-4 flex w-1/4 justify-end"
                on:click={openMainMenu}
                data-app-insights-event-name="feedback-menu-close-button-click"
            >
                <XMarkIcon />
            </button>
        </div>

        <div class="flex flex-col items-center">
            <h2 class="mb-12 text-xl font-bold">{$translate('page.feedback.feedbackSuccessfullySent.value')}</h2>
            <h2 class="mb-12 text-xl font-bold">{$translate('page.feedback.thankYou.value')}</h2>
        </div>
        <button
            class="btn btn-primary"
            on:click={openMainMenu}
            data-app-insights-event-name="feedback-menu-success-button-click"
            >{$translate('page.feedback.close.value')}</button
        >
    </div>
{:else if showFailure}
    <div class="flex h-full grow flex-col items-center justify-between pb-32">
        <div class="flex w-full justify-end pe-8">
            <button
                class="my-4 flex w-1/4 justify-end"
                on:click={openMainMenu}
                data-app-insights-event-name="feedback-menu-close-button-click"
            >
                <XMarkIcon />
            </button>
        </div>
        <div class="flex flex-col items-center">
            <h2 class="mb-12 text-xl font-bold">{$translate('page.feedback.feedbackFailedToSend.value')}</h2>
            <h2 class="mb-12 px-8 text-center text-xl font-bold">
                {$translate('page.feedback.pleaseCheckYourInternetConnectionAndRetry.value')}
            </h2>
        </div>
        <button
            class="btn btn-primary"
            on:click={handleSubmit}
            data-app-insights-event-name="feedback-menu-retry-button-click"
            >{$translate('page.feedback.retry.value')}</button
        >
    </div>
{:else}
    <div class="flex h-full w-full flex-col overflow-y-scroll px-4 pb-24 pt-6">
        <div class="flex justify-end">
            <button
                class="my-4 flex w-1/4 justify-end"
                on:click={openMainMenu}
                data-app-insights-event-name="feedback-menu-close-button-click"
            >
                <XMarkIcon />
            </button>
        </div>
        <h1 class="mb-6 text-2xl font-bold text-slate-600">{$translate('page.feedback.feedback.value')}</h1>
        <form on:submit|preventDefault={handleSubmit} class="flex flex-col px-4">
            <label for="name" class="ps-1 text-slate-600 {showErrors ? 'text-red-600' : ''}"
                >{$translate('page.feedback.feedbackForm.name.value')}{showErrors
                    ? ` ${$translate('page.feedback.feedbackForm.isRequired.value')}`
                    : ''}</label
            >
            <input
                bind:value={name}
                placeholder={$translate('page.feedback.feedbackForm.name.value')}
                name="name"
                class="mb-4 rounded-xl border p-4 focus:outline-none {showErrors ? 'border-red-600' : ''}"
            />

            <label for="email" class="ps-1 text-slate-600">{$translate('page.feedback.feedbackForm.email.value')}</label
            >
            <input
                bind:value={email}
                type="email"
                name={$translate('page.feedback.feedbackForm.email.value')}
                placeholder="Email"
                class="mb-4 rounded-xl border p-4 focus:outline-none"
            />

            <label for="name" class="ps-1 text-slate-600">{$translate('page.feedback.feedbackForm.phone.value')}</label>
            <input
                bind:value={phone}
                type="tel"
                placeholder={$translate('page.feedback.feedbackForm.phone.value')}
                name="phone"
                class="mb-4 rounded-xl border p-4 focus:outline-none"
            />

            <label for="often" class="ps-1 text-slate-600"
                >{$translate('page.feedback.feedbackForm.howOftenDoYouUseTheBibleWell.value')}</label
            >
            <input
                bind:value={usageFrequency}
                name="often"
                placeholder={$translate('page.feedback.feedbackForm.howOftenDoYouUseTheBibleWell.value')}
                class="mb-4 rounded-xl border p-4 focus:outline-none"
            />

            <fieldset class="mb-4 flex flex-col px-4 text-slate-600">
                <legend class="mb-2 text-lg"
                    >{$translate('page.feedback.feedbackForm.howAreYouUsingTheBibleWell.value')}</legend
                >
                {#each bibleUseOptions as { name, value }}
                    <label class="ps-2">
                        <input type="checkbox" bind:group={bibleWellUses} {value} />
                        {name}
                    </label>
                {/each}
            </fieldset>

            <textarea
                bind:value={likes}
                placeholder={$translate('page.feedback.feedbackForm.whatDoYouLikeMostAboutTheBibleWell.value')}
                class="mb-4 min-h-36 rounded-xl border p-4 pt-2 focus:outline-none {showErrors ? 'border-red-600' : ''}"
            ></textarea>

            {#if showErrors}
                <p class="mb-4 w-full text-center text-red-600">
                    {$translate('page.feedback.feedbackForm.likesOrImprovementsFeedbackRequired.value')}
                </p>
            {/if}

            <textarea
                bind:value={improvements}
                placeholder={$translate('page.feedback.feedbackForm.WhatCanBeImproved.value')}
                class="mb-4 min-h-36 rounded-xl border p-4 pt-2 focus:outline-none {showErrors ? 'border-red-600' : ''}"
            ></textarea>
            <div class="flex w-full justify-end">
                <button
                    type="submit"
                    class="btn btn-primary w-1/2"
                    data-app-insights-event-name="feedback-menu-submit-button-click"
                    >{$translate('page.feedback.submit.value')}</button
                >
            </div>
        </form>
    </div>
{/if}
