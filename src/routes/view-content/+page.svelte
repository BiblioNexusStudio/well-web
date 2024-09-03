<script lang="ts">
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { buildContentViewerPath } from './[guideId]/[bibleSection]/context';

    if (browser) {
        goto(buildContentViewerPath(null, null, null, undefined));
    }
</script>
