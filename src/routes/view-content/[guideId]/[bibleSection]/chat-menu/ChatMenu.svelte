<script lang="ts">
    import { _ as translate } from 'svelte-i18n';

    export let hidden: boolean;
    export let loadFaithBridgeIframe: boolean = false;
</script>

<div class="h-full w-full pb-20 {!hidden ? 'hidden' : ''}">
    {#if loadFaithBridgeIframe}
        <iframe
            title={$translate('page.ChatMenu.FaithBridgeMultilingualArtificialIntelligence.value')}
            class="h-full w-full"
            src="https://faithbridge.multilingualai.com/bible-well"
            allow="microphone; autoplay"
        ></iframe>
    {/if}
</div>
