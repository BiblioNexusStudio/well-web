<script lang="ts">
    export let selectedTab: string | null = null;
    export let tabName: string | null = null;
    export let label: string;
    export let isSelected: boolean | null = null;
    export let hideOnXl = false;

    function handleClick() {
        if (tabName !== null) {
            selectedTab = tabName;
        } else {
            isSelected = !isSelected;
        }
    }

    $: isSelected = selectedTab !== null && tabName !== null ? selectedTab === tabName : false;
</script>

<li
    class={`flex flex-col group text-primary text-xs text-center pt-3 pb-4 px-3 ${hideOnXl ? 'xl:hidden' : ''} ${
        isSelected && 'font-bold'
    }`}
>
    <button on:click={handleClick}>
        <div
            class={`rounded-2xl py-1 px-5 mb-1 focus:bg-primary-50 group-hover:bg-primary-50
group-hover:stroke-primary ${isSelected ? 'bg-primary-50 stroke-primary' : 'stroke-primary-300'}`}
        >
            <slot />
        </div>
        <div>{label}</div>
    </button>
</li>
