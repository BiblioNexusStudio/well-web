<script lang="ts">
    import refresh from 'svelte-awesome/icons/refresh';
    import { Icon } from 'svelte-awesome';

    export let height: string | undefined = undefined;
    export let isShowing: boolean = true;
</script>

<div class="flex {height ?? 'h-full'} {!isShowing && 'hidden'} w-full flex-row bg-white">
    <Icon class="mx-auto self-center stroke-base-content" data={refresh} scale={2} spin />
</div>
