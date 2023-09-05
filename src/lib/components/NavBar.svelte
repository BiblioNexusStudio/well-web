<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import navicon from 'svelte-awesome/icons/navicon';

    export let title: string = 'Local File Storage';
</script>

<div class="drawer drawer-end">
    <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
        <!-- Navbar -->
        <div class="w-full navbar bg-base-300">
            <div class="flex-1 px-2 mx-2">{title}</div>
            <div class="flex-none">
                <label for="my-drawer-3" class="btn btn-square btn-ghost">
                    <Icon data={navicon} />
                </label>
            </div>
        </div>
    </div>
    <div class="drawer-side z-10">
        <label for="my-drawer-3" class="drawer-overlay" />
        <ul class="menu p-4 w-80 min-h-full bg-base-200">
            <!-- Sidebar content here -->
            <li>Sidebar Item 1</li>
            <li>Sidebar Item 2</li>
        </ul>
    </div>
</div>
