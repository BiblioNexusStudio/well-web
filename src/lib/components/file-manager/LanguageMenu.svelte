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

<div class="relative flex h-full w-1/2 items-center pl-2" bind:this={lanaguageMenuDiv}>
    <button class="btn btn-primary btn-outline flex w-full justify-between" on:click={toggleMenu}>
        {currentLanguage?.label} ({$currentLanguageCode}) <Icon data={menuOpen ? caretUp : caretDown} />
    </button>
    {#if menuOpen}
        <div class="border-2-primary menu absolute right-0 top-16 z-30 space-y-8 rounded-md bg-white p-4 shadow-lg">
            {#each supportedLanguages as lanaguage}
                <button
                    type="button"
                    class="ml-8 flex justify-start text-primary"
                    on:click={() => onLanguageSelected(lanaguage.code)}
                    aria-label={lanaguage.label}
                >
                    {lanaguage.label} <span class="ml-2 uppercase"> ({lanaguage.code})</span>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .menu {
        width: calc(100vw - 2rem);
        border: 2px solid #80d4f3;
    }
</style>
