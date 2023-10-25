<script lang="ts">
    import { onMount } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import type { ApiResourceType, ApiLicenseInfo } from '$lib/types/resource';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { Icon } from 'svelte-awesome';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import { goto } from '$app/navigation';
    import type { BaseBible } from '$lib/types/bible-text-content';

    let resourceLicensesPromise: Promise<ApiLicenseInfo[]> | null = null;

    onMount(() => {
        resourceLicensesPromise = fetchLicenses();
    });

    async function fetchLicenses() {
        const [resourceLicenses, bibleLicenses] = await Promise.all([
            fetchFromCacheOrApi('/resources/types') as Promise<ApiResourceType[]>,
            fetchFromCacheOrApi('/bibles') as Promise<BaseBible[]>,
        ]);
        const licenses = resourceLicenses
            .map((type) => type.licenseInfo)
            .concat(bibleLicenses.map((bible) => bible.licenseInfo))
            .filter(Boolean) as ApiLicenseInfo[];
        return licenses.sort((a, b) => a.title.localeCompare(b.title));
    }
</script>

<section class="container mx-auto flex h-screen flex-col">
    <div class="mx-auto flex w-full max-w-[65ch] flex-row items-center py-3">
        <button class="btn btn-link text-base-500" on:click={() => goto('/')}><Icon data={chevronLeft} /></button>
        <div class="flex-grow px-3 text-center text-lg font-semibold text-base-content">
            {$translate('page.index.about.value')}
        </div>
        <!-- hack to make text centered -->
        <div class="btn btn-link text-base-500 opacity-0"><Icon data={chevronLeft} /></div>
    </div>
    {#await resourceLicensesPromise}
        <FullPageSpinner />
    {:then resourceLicenses}
        <div class="flex flex-col self-center px-4">
            <div class="prose my-6">
                {#if resourceLicenses}
                    {#each resourceLicenses as license}
                        <h4>{license.title}</h4>
                        <div class="ml-4">
                            <div>
                                © {license.copyright.dates ?? ''}
                                {#if license.copyright.holder.url}
                                    <a class="text-sky-500" href={license.copyright.holder.url}
                                        >{license.copyright.holder.name}</a
                                    >
                                {:else}
                                    {license.copyright.holder.name}
                                {/if}
                            </div>
                            {#if license.license?.eng}
                                <div>
                                    {@html $translate('page.about.license.releasedUnder.value', {
                                        values: {
                                            license: license.license.eng.url
                                                ? `<a class="text-sky-500"
                                    href="${license.license.eng.url}">${license.license.eng.name}</a>`
                                                : license.license.eng.name,
                                        },
                                    })}
                                </div>
                            {/if}
                        </div>
                    {/each}
                {:else}
                    {$translate('page.about.error.value')}
                {/if}
            </div>
        </div>
    {:catch}
        <div class="flex flex-col self-center px-4">
            <div class="prose my-6">
                {$translate('page.about.error.value')}
            </div>
        </div>
    {/await}
</section>
