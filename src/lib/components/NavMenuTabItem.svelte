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

<button on:click={handleClick} class="group stroke-black active border-none">
    <div
        class="rounded-2xl py-1 px-5 focus:bg-primary-50 group-hover:bg-primary-50 group-hover:stroke-primary {isSelected
            ? 'bg-primary-50 stroke-primary'
            : 'stroke-primary-300'}"
    >
        {#if flipWhenSelected}
            <div
                style={`transform: rotateX(${isSelected ? '180deg' : '0deg'});`}
                class="transition-transform duration-300 transform origin-center"
            >
                <slot />
            </div>
        {:else}
            <slot />
        {/if}
    </div>
    <span class="btm-nav-label text-primary text-xs {isSelected && 'font-bold'}">{label}</span>
</button>
