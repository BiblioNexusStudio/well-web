<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import caretUp from 'svelte-awesome/icons/caretUp';
    import caretDown from 'svelte-awesome/icons/caretDown';
    import { bibleData } from '$lib/stores/file-manager.store';

    let menuOpen = false;

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const resouces = [
        ...$bibleData.map((bible) => ({
            name: bible.name,
            value: String(bible.languageId),
            selected: false,
        })),
        {
            name: 'CBBT-ER',
            value: 'resources',
            selected: false,
        },
        {
            name: 'Tyndale Bible Dictionary',
            value: 'tyndaleBibleDictionary',
            selected: false,
        },
        {
            name: 'Tyndale Study Notes',
            value: 'tyndaleStudyNotes',
            selected: false,
        },
        {
            name: 'Video Bible Dictionary',
            value: 'videoBibleDictionary',
            selected: false,
        },
    ];
</script>

<div class="flex h-full items-center relative w-1/2">
    <button class="btn btn-primary btn-outline flex justify-between w-full mr-2" on:click={toggleMenu}>
        Resources ({resouces.length + 1}) <Icon data={menuOpen ? caretUp : caretDown} />
    </button>
    {#if menuOpen}
        <div class="absolute top-16 left-0 border-2-primary bg-white shadow-lg rounded-md menu z-30">
            <!--svelte each-->
            {#each resouces as resouce}
                <label class="label cursor-pointer mb-4 justify-start">
                    <input type="checkbox" bind:checked={resouce.selected} class="checkbox checkbox-primary" />
                    <span class="label-text ml-4">{resouce.name}</span>
                </label>
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
