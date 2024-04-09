<script lang="ts">
    import { CupertinoPane } from 'cupertino-pane';
    import { onMount } from 'svelte';

    export let guidePane: CupertinoPane;
    export let isShowing: boolean;

    onMount(() => {
        const bottomBarHeight = parseFloat(getComputedStyle(document.documentElement).fontSize) * 4;
        guidePane = new CupertinoPane('#guide-pane', {
            backdrop: true,
            topperOverflow: true,
            bottomOffset: bottomBarHeight,
            events: {
                onWillDismiss: () => (isShowing = false),
                onBackdropTap: () => (isShowing = false),
            },
        });
    });
</script>

<div id="guide-pane">hello from the guide pane</div>
