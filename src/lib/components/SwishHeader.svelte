<script lang="ts">
    import { slide } from 'svelte/transition';
    import { cubicInOut } from 'svelte/easing';

    export let title: string;
    export let subtitle: string;
    export let bgcolor: string = 'bg-[#EAAA08]';

    export let visible = true;
</script>

{#if visible}
    <div
        transition:slide={{ duration: 500, easing: cubicInOut }}
        class="relative mb-3 flex h-40 w-full flex-shrink-0 rounded-b-3xl {bgcolor} ps-6 pt-12"
    >
        <div class="absolute bottom-0 left-0 right-0 top-0">
            <img src="/menu-swish.png" alt="Menu Swish" class="h-full w-full rounded-b-3xl object-fill" />
        </div>
        <div class="flex flex-col">
            <h2 class="z-10 mb-2 text-2xl font-bold text-white">{title}</h2>
            <span class="z-10 text-sm text-white">{subtitle}</span>
        </div>
    </div>
{/if}
