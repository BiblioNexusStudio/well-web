<script lang="ts">
    import { onMount } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import type { ApiParentResource, ApiLicenseInfo } from '$lib/types/resource';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { Icon } from 'svelte-awesome';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import { goto } from '$app/navigation';
    import type { BaseBible } from '$lib/types/bible-text-content';

    let licenseInfosPromise: Promise<ApiLicenseInfo[]> | null = null;

    onMount(() => {
        licenseInfosPromise = fetchLicenses();
    });

    function calculateLicenseDescription(licenseInfo: ApiLicenseInfo) {
        const licenses = licenseInfo.licenses.map((license) => license.eng).filter(Boolean);
        if (licenses.length === 0) {
            return null;
        }
        if (licenses.length === 1) {
            const license = licenses[0];
            return $translate('page.about.license.releasedUnderSingle.value', {
                values: {
                    name: license.url
                        ? `<a target="_blank" rel="noopener noreferrer" class="text-sky-500" href="${license.url}">${license.name}</a>`
                        : license.name,
                },
            });
        } else {
            return $translate('page.about.license.releasedUnderMultiple.value', {
                values: {
                    names: licenses
                        .map((license) =>
                            license.url
                                ? `<a target="_blank" rel="noopener noreferrer" class="text-sky-500" href="${license.url}">${license.name}</a>`
                                : license.name
                        )
                        .join(', '),
                },
            });
        }
    }

    async function fetchLicenses() {
        const [resourceLicenses, bibleLicenses] = await Promise.all([
            fetchFromCacheOrApi('/resources/parent-resources') as Promise<ApiParentResource[]>,
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
    {#await licenseInfosPromise}
        <FullPageSpinner />
    {:then licenseInfos}
        <div class="flex flex-col self-center px-4">
            <div class="prose my-6">
                {#if licenseInfos}
                    {#each licenseInfos as licenseInfo}
                        {@const licenseDescription = calculateLicenseDescription(licenseInfo)}
                        <h4>{licenseInfo.title}</h4>
                        <div class="ms-4">
                            <div>
                                © {licenseInfo.copyright.dates ?? ''}
                                {#if licenseInfo.copyright.holder.url}
                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="text-sky-500"
                                        href={licenseInfo.copyright.holder.url}>{licenseInfo.copyright.holder.name}</a
                                    >
                                {:else}
                                    {licenseInfo.copyright.holder.name}
                                {/if}
                            </div>
                            {#if licenseDescription}
                                <div>
                                    {@html licenseDescription}
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
