<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { goto } from '$app/navigation';
    import PassageForm from '$lib/components/PassageForm.svelte';

    const goToFileManager = () => {
        goto('/file-manager');
    };
</script>

<section class="container mx-auto flex h-screen">
    <div class="flex-grow self-center">
        <h1 class="text-center font-semibold text-primary text-7xl pb-6">AQUIFER</h1>
        <PassageForm />
        <button class="btn btn-info mx-auto mt-8 mx-auto" on:click|preventDefault={goToFileManager}
            >{$translate('page.index.downloadResourcesForOfflineUse.value')}</button
        >
    </div>
</section>
