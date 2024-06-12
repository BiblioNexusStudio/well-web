<script lang="ts">
    // This component has two options:
    // 1) selectedTab and tabName
    //    These are meant to be used for "tab-like" content where only one tab displays at a time
    // 2) isSelected
    //    This is for toggle-able things like drawers that are separate from tab content
    export let selectedTab: string | null = null;
    export let tabName: string | null = null;
    export let label: string;
    export let isSelected: boolean | null = null;
    export let flipWhenSelected = false;

    function handleClick() {
        if (tabName !== null) {
            selectedTab = tabName;
        } else {
            isSelected = !isSelected;
        }
    }

    $: isSelected = selectedTab !== null && tabName !== null ? selectedTab === tabName : false;
</script>

<button
    on:click={handleClick}
    class="group active border-none stroke-black"
    data-app-insights-event-name="footer-nav-tab-clicked"
>
    <div
        class="rounded-2xl px-3 py-1 focus:bg-[#F0FAFF] group-hover:bg-[#F0FAFF] group-hover:stroke-primary {isSelected
            ? 'bg-[#F0FAFF]'
            : ''}"
    >
        {#if flipWhenSelected}
            <div
                style={`transform: rotateX(${isSelected ? '180deg' : '0deg'});`}
                class="origin-center transform transition-transform duration-300"
            >
                <slot />
            </div>
        {:else}
            <slot />
        {/if}
    </div>
    <span class="btm-nav-label text-xs text-[#475467] {isSelected && 'font-bold'}">{label}</span>
</button>
