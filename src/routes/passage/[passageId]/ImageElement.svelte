<script lang="ts">
    import { cachedOrRealUrl } from '$lib/data-cache';
    import type { ImageState } from './image-and-video-state';

    export let imageState: ImageState;

    function onLoad() {
        imageState.isLoading = false;
    }

    function onError() {
        imageState.isLoading = false;
        imageState.hasError = true;
    }
</script>

<img
    on:load={onLoad}
    on:error={onError}
    bind:this={imageState.element}
    class="rounded-lg object-contain"
    src={cachedOrRealUrl(imageState.url ?? '')}
    alt={imageState.displayName}
/>
