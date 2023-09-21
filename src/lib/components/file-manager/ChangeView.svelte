<script lang="ts">
    import { hideDownloadedBundles } from '$lib/stores/file-manager.store';
    let menuOpen = false;

    function toggleMenu() {
        menuOpen = !menuOpen;
    }
</script>

<div class="flex h-full items-center relative">
    <button
        on:click={toggleMenu}
        class="btn {menuOpen
            ? 'bg-primary text-white'
            : 'text-primary bg-transparent'} no-animation lowercase shadow-none border-transparent hover:bg-transparent hover:border-0"
        >Change view...</button
    >
    <!--mene that open under it's paranent div if the menuOpen var is true-->
    {#if menuOpen}
        <div class="absolute top-16 right-0 border-2-primary bg-white shadow-lg rounded-md menu z-40">
            <div class="p-1 flex flex-col">
                <h3 class="text-l font-bold mb-4">Download Bundles</h3>
                <div class="flex pl-4">
                    <label class="label cursor-pointer mb-4">
                        <input
                            type="checkbox"
                            bind:checked={$hideDownloadedBundles}
                            class="checkbox checkbox-primary"
                        />
                        <span class="label-text ml-4">Hide downloaded bundles</span>
                    </label>
                </div>
                <h3 class="text-l font-bold mb-4">Change View</h3>
                <div class="flex flex-col pl-4 space-y-4">
                    <div class="form-control">
                        <label class="label justify-start cursor-pointer">
                            <input type="radio" name="radio-10" class="radio checked:bg-primary" checked />
                            <span class="label-text ml-4">Book</span>
                        </label>
                    </div>
                    <div class="form-control">
                        <label class="label justify-start cursor-pointer">
                            <input type="radio" name="radio-10" class="radio checked:bg-primary" checked />
                            <span class="label-text ml-4">Chapter</span>
                        </label>
                    </div>
                    <div class="form-control">
                        <label class="label justify-start cursor-pointer">
                            <input type="radio" name="radio-10" class="radio checked:bg-primary" checked />
                            <span class="label-text ml-4">Pericope</span>
                        </label>
                    </div>
                    <div class="form-control">
                        <label class="label justify-start cursor-pointer">
                            <input type="radio" name="radio-10" class="radio checked:bg-primary" checked />
                            <span class="label-text ml-4">Resource</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .menu {
        width: calc(100vw - 2rem);
        border: 2px solid #b5ac8b;
    }
</style>
