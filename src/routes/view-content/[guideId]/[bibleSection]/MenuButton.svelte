<script>
    export let onClick = () => {};
    export let disabled = false;
    export let selected = false;
</script>

<button
    on:click={onClick}
    class="group my-2 flex w-11/12 flex-wrap items-center rounded-xl border p-4 {disabled && 'bg-gray-200'} {selected
        ? 'border-2 border-[#3db6e7] bg-[#f0faff]'
        : 'border'}"
    data-app-insights-event-name={$$props['data-app-insights-event-name']}
    data-app-insights-dimensions={$$props['data-app-insights-dimensions']}
>
    <div class="text-sm">
        <slot />
    </div>
</button>
