<script lang="ts">
    import { currentLanguageInfo, supportedLanguages, updateCurrentLanguageCode } from '$lib/stores/language.store';
    import { Icon } from 'svelte-awesome';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import { onMount } from 'svelte';

    let languageMenuDiv: HTMLElement;
    let menuOpen = false;

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const onLanguageSelected = (languageCode: string) => {
        updateCurrentLanguageCode(languageCode);
        toggleMenu();
    };

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (languageMenuDiv && !languageMenuDiv.contains(event.target as Node) && menuOpen) {
                toggleMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div class="relative ms-2 flex h-full flex-1 items-center" bind:this={languageMenuDiv}>
    <button
        class="btn btn-outline btn-primary flex w-full justify-between"
        on:click={toggleMenu}
        data-app-insights-event-name="file-manager-language-menu-selected"
    >
        {$currentLanguageInfo?.displayName} ({$currentLanguageInfo?.iso6393Code}) <Icon
            data={menuOpen ? caretUp : caretDown}
        />
    </button>
    {#if menuOpen}
        <div
            class="menu absolute right-0 top-16 z-30 space-y-8 rounded-md border-2 border-primary-300 bg-white p-4 shadow-lg"
            style="width: {languageMenuDiv.clientWidth}px;"
        >
            {#each $supportedLanguages as language}
                <button
                    type="button"
                    class="flex justify-start text-primary"
                    on:click={() => onLanguageSelected(language.iso6393Code)}
                    aria-label={language.displayName}
                    data-app-insights-event-name="file-manager-language-selected"
                >
                    {language.displayName} <span class="ms-2 uppercase"> ({language.iso6393Code})</span>
                </button>
            {/each}
        </div>
    {/if}
</div>
