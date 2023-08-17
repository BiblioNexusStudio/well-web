<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
</script>

<footer class="footer footer-center p-4 bg-base-300 text-base-content fixed bottom-0 left-0">
    <div class="container mx-auto flex justify-between">
        <div>
            <a href="/"
                ><button class="btn btn-neutral">{$translate('page.index.back.value')}</button></a
            >
        </div>
        <div class="flex">
            <button class="btn btn-neutral">{$translate('page.index.cancel.value')}</button>
            <button class="btn btn-primary ml-4">{$translate('page.index.update.value')}</button>
        </div>
    </div>
</footer>
