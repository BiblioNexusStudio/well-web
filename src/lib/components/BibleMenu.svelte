<script lang="ts">
    import { _ as translate } from 'svelte-i18n';

    export let showBibleMenu: boolean;

    function openBibleMenu() {
        showBibleMenu = true;
    }
</script>

<div class="z-50 flex h-full w-full flex-col">
    <div class="relative mb-6 flex h-[166px] w-full rounded-b-3xl bg-[#6172F3] pl-6 pt-12">
        <div class="absolute bottom-0 left-0 w-full">
            <img src="/menu-swish.png" alt="Menu Swish" class="h-auto w-full rounded-b-3xl" />
        </div>
        <div class="flex flex-col">
            <h2 class="z-10 mb-2 text-2xl font-bold text-white">{$translate('page.bibleMenu.bible.value')}</h2>
            <span class="z-10 text-sm text-white">{$translate('page.bibleMenu.selectBible.value')}</span>
        </div>
    </div>
    <div class="mb-24 flex flex-grow items-end px-4">
        <button on:click={openBibleMenu} class="btn btn-primary w-full"
            >{$translate('page.bibleMenu.selectBible.value')}</button
        >
    </div>
</div>
