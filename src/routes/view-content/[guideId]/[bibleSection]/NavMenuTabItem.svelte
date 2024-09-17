<script lang="ts">
    import { ContentTabEnum, getContentContext } from './context';

    const { currentTab, setCurrentTab } = getContentContext();

    export let tabName: ContentTabEnum;
    export let label: string;

    function handleClick() {
        setCurrentTab(tabName);
    }

    $: isSelected = $currentTab === tabName;
</script>

<button
    on:click={handleClick}
    class="group active border-none stroke-black"
    data-app-insights-event-name="footer-nav-tab-clicked"
    data-app-insights-dimensions={`label,${tabName}`}
>
    <div
        class="rounded-2xl px-3 py-1 focus:bg-[#F0FAFF] group-hover:bg-[#F0FAFF] group-hover:stroke-primary {isSelected
            ? 'bg-[#F0FAFF]'
            : ''}"
    >
        <slot />
    </div>
    <span class="btm-nav-label text-xs text-[#475467] {isSelected && 'font-bold'}">{label}</span>
</button>
