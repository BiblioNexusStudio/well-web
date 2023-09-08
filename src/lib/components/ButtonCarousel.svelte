<script lang="ts">
    export let buttons: { value: string | number; label: string }[];
    export let selectedValue: string | number;
</script>

<div class="carousel space-x-2 text-base-500 bg-base-100 w-full">
    {#each buttons as { value, label }}
        <div class="carousel-item">
            <button
                class={`text-sm font-semibold px-3 py-2 rounded-md ${
                    selectedValue === value && 'text-secondary-content bg-primary-50'
                }`}
                on:click={() => (selectedValue = value)}
            >
                {label}</button
            >
        </div>
    {/each}
</div>
