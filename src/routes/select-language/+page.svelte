<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { supportedLanguages, updateCurrentLanguageCode, currentLanguageInfo } from '$lib/stores/language.store';
    import { goto } from '$app/navigation';

    function setLanguageAndLocalStorage(languageCode: string) {
        updateCurrentLanguageCode(languageCode);
        localStorage && localStorage.setItem('bible-well-language-code-set', 'true');
    }

    function setLocalStorageAndNavigate() {
        localStorage && localStorage.setItem('bible-well-language-code-set', 'true');
        goto('/');
    }
</script>

<div class="flex h-full w-full flex-col p-4">
    <div class="mb-4 flex h-9 w-20">
        <img class="h-full w-full object-contain" src="/bibleWellLogoWithText-568.png" alt="Bible Well Logo" />
    </div>
    <h1 class="mb-2 text-xl font-bold">{$translate('page.selectLanguage.welcome.value')}</h1>
    <span class="mb-6 text-sm text-[#475467]"
        >{$translate('page.selectLanguage.chooseYourPreferredLanguage.value')}</span
    >
    <div class="mb-4 flex flex-grow flex-col overflow-y-scroll">
        {#each $supportedLanguages as { iso6393Code, displayName, englishDisplay }}
            {@const isCurrentLanguageSelected = $currentLanguageInfo?.iso6393Code === iso6393Code}
            <button
                on:click={() => setLanguageAndLocalStorage(iso6393Code)}
                class="text-md mb-2 flex justify-between rounded-xl border p-4 text-center {isCurrentLanguageSelected
                    ? 'border-[2px] border-primary bg-[#F0FAFF] text-primary'
                    : 'text-[#475467]'}"
                data-app-insights-event-name={`${englishDisplay}-language-selected`}
            >
                {displayName}
                <input
                    type="checkbox"
                    checked={isCurrentLanguageSelected}
                    class="checkbox rounded-full {isCurrentLanguageSelected ? 'checkbox-primary' : ''}"
                />
            </button>
        {/each}
    </div>
    <button
        on:click={() => setLocalStorageAndNavigate()}
        class="btn btn-primary mb-4"
        disabled={!$currentLanguageInfo || !$currentLanguageInfo.iso6393Code}
        data-app-insights-event-name="language-selected-next-button-clicked"
        >{$translate('page.selectLanguage.next.value')}</button
    >
</div>
