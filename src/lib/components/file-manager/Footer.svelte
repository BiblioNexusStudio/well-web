<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { currentBibleBook } from '$lib/stores/file-manager.store';

    $: console.log('currentBibleBook', $currentBibleBook);

    const updateFiles = () => {
        console.log('updateFiles');
    };

    const cancelUpdateFiles = () => {
        console.log('cancelUpdateFiles');
    };
</script>

<footer class="footer footer-center p-4 bg-base-300 text-base-content fixed bottom-0 left-0">
    <div class="container mx-auto flex justify-between">
        <div>
            <a href="/"
                ><button class="btn btn-neutral">{$translate('page.index.back.value')}</button></a
            >
        </div>
        <div class="flex">
            <button class="btn btn-neutral" on:click={updateFiles}
                >{$translate('page.index.cancel.value')}</button
            >
            <button class="btn btn-primary ml-4" on:click={cancelUpdateFiles}
                >{$translate('page.index.update.value')}</button
            >
        </div>
    </div>
</footer>
