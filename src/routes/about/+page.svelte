<script lang="ts">
    import { onMount } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { fetchFromCacheOrApi } from '$lib/data-cache';
    import type { ApiParentResource, ApiLicenseInfo } from '$lib/types/resource';
    import FullPageSpinner from '$lib/components/FullPageSpinner.svelte';
    import { Icon } from 'svelte-awesome';
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import { goto } from '$app/navigation';
    import type { BaseBible } from '$lib/types/bible';
    import { biblesEndpoint, biblesWithRestrictionsEndpoint, parentResourcesEndpoint } from '$lib/api-endpoints';
    import { filterBoolean } from '$lib/utils/array';
    import PublicDomainIcon from '$lib/icons/PublicDomainIcon.svelte';

    let licenseInfosPromise: Promise<ApiLicenseInfo[]> | null = null;

    onMount(() => {
        licenseInfosPromise = fetchLicenses();
    });

    function calculateLicenseDescription(licenseInfo: ApiLicenseInfo) {
        const licenses = filterBoolean(licenseInfo.licenses.map((license) => license['eng']));
        if (licenses.length === 0) {
            return null;
        }
        if (licenses.length === 1) {
            const license = licenses[0]!;
            return $translate('page.about.license.releasedUnderSingle.value', {
                values: {
                    name: license.url
                        ? `<a target="_blank" rel="noopener noreferrer" class="text-sky-500" href="${license.url}" data-app-insights-event-name="about-page-link-clicked">${license.name}</a>`
                        : license.name,
                },
            });
        } else {
            return $translate('page.about.license.releasedUnderMultiple.value', {
                values: {
                    names: licenses
                        .map((license) =>
                            license.url
                                ? `<a target="_blank" rel="noopener noreferrer" class="text-sky-500" href="${license.url}" data-app-insights-event-name="about-page-link-clicked">${license.name}</a>`
                                : license.name
                        )
                        .join(', '),
                },
            });
        }
    }

    async function fetchLicenses() {
        const [resources, bibles, biblesWithRestrictions] = await Promise.all([
            fetchFromCacheOrApi(...parentResourcesEndpoint()) as Promise<ApiParentResource[]>,
            fetchFromCacheOrApi(...biblesEndpoint()) as Promise<BaseBible[]>,
            fetchFromCacheOrApi(...biblesWithRestrictionsEndpoint()) as Promise<BaseBible[]>,
        ]);
        const licenses = filterBoolean(
            resources
                .map((type) => type.licenseInfo)
                .concat(bibles.map((bible) => bible.licenseInfo))
                .concat(biblesWithRestrictions.map((bible) => bible.licenseInfo))
        );
        return licenses
            .filter((license, index, self) => index === self.findIndex((t) => t.title === license.title)) // get rid of duplicates
            .sort((a, b) => a.title.localeCompare(b.title));
    }
</script>

<section class="container mx-auto flex h-screen flex-col">
    <div class="mx-auto flex w-full max-w-[65ch] flex-row items-center py-3">
        <button
            class="btn btn-link text-base-500"
            on:click={() => goto('/')}
            data-app-insights-event-name="about-page-back-button-clicked"><Icon data={chevronLeft} /></button
        >
        <div class="flex-grow px-3 text-center text-lg font-semibold text-base-content">
            {$translate('page.index.about.value')}
        </div>
        <!-- hack to make text centered -->
        <div class="btn btn-link text-base-500 opacity-0"><Icon data={chevronLeft} /></div>
    </div>
    {#await licenseInfosPromise}
        <FullPageSpinner />
    {:then licenseInfos}
        <div class="flex flex-col self-center overflow-y-scroll px-4">
            <div class="prose my-6">
                {#if licenseInfos}
                    {#each licenseInfos as licenseInfo}
                        {@const licenseDescription = calculateLicenseDescription(licenseInfo)}
                        <h4>{licenseInfo.title}</h4>
                        <div class="ms-4">
                            <div class="flex flex-row items-start space-x-1">
                                {#if licenseInfo.copyright.holder.name
                                    .replaceAll(' ', '')
                                    .toLowerCase() === 'publicdomain'}
                                    <PublicDomainIcon class="me-[-2px] ms-[-4px] mt-0.5 scale-[55%]" />
                                    {licenseInfo.copyright.holder.name}
                                {:else}
                                    <span>©</span>
                                    {#if licenseInfo.copyright.dates}
                                        <span>
                                            {licenseInfo.copyright.dates}
                                        </span>
                                    {/if}
                                    {#if licenseInfo.copyright.holder.url}
                                        <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="text-sky-500"
                                            href={licenseInfo.copyright.holder.url}
                                            data-app-insights-event-name="about-page-copyright-link-clicked"
                                            data-app-insights-dimensions={`copyrightHolder,${licenseInfo.copyright.holder.name}`}
                                            >{licenseInfo.copyright.holder.name}</a
                                        >
                                    {:else}
                                        {licenseInfo.copyright.holder.name}
                                    {/if}
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
