<script lang="ts">
    import { slide } from 'svelte/transition';
    export let title: string;
    export let subtitle: string;
    export let bgcolor: string = 'bg-[#EAAA08]';

    export let visible = true;
</script>

{#if visible}
    <div
        transition:slide={{ duration: 1000 }}
        class="relative mb-6 flex h-[166px] w-full rounded-b-3xl {bgcolor} ps-6 pt-12"
    >
        <div class="absolute bottom-0 left-0 w-full">
            <img src="/menu-swish.png" alt="Menu Swish" class="h-auto w-full rounded-b-3xl" />
        </div>
        <div class="flex flex-col">
            <h2 class="z-10 mb-2 text-2xl font-bold text-white">{title}</h2>
            <span class="z-10 text-sm text-white">{subtitle}</span>
        </div>
    </div>
{/if}
