<script lang="ts">
    export let isVisible = true;
    export let title: string;
    export let subtitle: string | null;
</script>

<div class={isVisible ? 'visible' : 'hidden'}>
    <div class="flex pb-4 pt-4">
        <div class="text-md font-semibold text-blue-title">
            {title}
        </div>
        <div class="font-sans-serif flex items-end pb-[1px] ps-1 text-sm font-light text-base-700 opacity-50">
            {subtitle ?? ''}
        </div>

        <div class="flex-grow"></div>
        <slot />
    </div>
</div>
