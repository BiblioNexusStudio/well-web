<script lang="ts">
    import { currentLanguageCode } from '$lib/stores/current-language.store';
    import { supportedLanguages } from '$lib/utils/language-utils';
    import { Icon } from 'svelte-awesome';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import { onMount } from 'svelte';

    let languageMenuDiv: HTMLElement;
    let menuOpen = false;

    $: currentLanguage = supportedLanguages.find((language) => language.code === $currentLanguageCode);

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const onLanguageSelected = (lanaguageCode: string) => {
        $currentLanguageCode = lanaguageCode;
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

<div class="relative ms-2 flex h-full w-1/2 items-center" bind:this={languageMenuDiv}>
    <button class="btn btn-outline btn-primary flex w-full justify-between" on:click={toggleMenu}>
        {currentLanguage?.label} ({$currentLanguageCode}) <Icon data={menuOpen ? caretUp : caretDown} />
    </button>
    {#if menuOpen}
        <div
            class="menu absolute right-0 top-16 z-30 space-y-8 rounded-md border-2 border-primary-300 bg-white p-4 shadow-lg"
            style="width: {languageMenuDiv.clientWidth}px;"
        >
            {#each supportedLanguages as lanaguage}
                <button
                    type="button"
                    class="flex justify-start text-primary"
                    on:click={() => onLanguageSelected(lanaguage.code)}
                    aria-label={lanaguage.label}
                >
                    {lanaguage.label} <span class="ms-2 uppercase"> ({lanaguage.code})</span>
                </button>
            {/each}
        </div>
    {/if}
</div>
