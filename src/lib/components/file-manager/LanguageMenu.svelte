<script lang="ts">
    import { currentLanguageCode } from '$lib/stores/current-language.store';
    import { supportedLanguages } from '$lib/utils/language-utils';
    import { Icon } from 'svelte-awesome';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import { onMount } from 'svelte';

    let lanaguageMenuDiv: HTMLElement;
    let menuOpen = false;

    $: currentLanguage = supportedLanguages.find((language) => language.code === $currentLanguageCode);

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const onLanguageSelected = (lanaguageCode: string) => {
        $currentLanguageCode = lanaguageCode;
    };

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (lanaguageMenuDiv && !lanaguageMenuDiv.contains(event.target as Node) && menuOpen) {
                toggleMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div class="flex h-full items-center relative w-1/2 pl-2" bind:this={lanaguageMenuDiv}>
    <button class="btn btn-primary btn-outline flex justify-between w-full" on:click={toggleMenu}>
        {currentLanguage?.label} ({$currentLanguageCode}) <Icon data={menuOpen ? caretUp : caretDown} />
    </button>
    {#if menuOpen}
        <div class="absolute top-16 right-0 border-2-primary bg-white shadow-lg rounded-md menu z-30 p-4 space-y-8">
            {#each supportedLanguages as lanaguage}
                <button
                    type="button"
                    class="flex justify-start ml-8 text-primary"
                    on:click={() => onLanguageSelected(lanaguage.code)}
                    aria-label={lanaguage.label}
                >
                    {lanaguage.label} <span class="uppercase ml-2"> ({lanaguage.code})</span>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .menu {
        width: calc(100vw - 2rem);
        border: 2px solid #b5ac8b;
    }
</style>
