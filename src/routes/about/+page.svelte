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
    import { supportedLanguages } from '$lib/stores/language.store';

    let licenseInfosPromise: Promise<ApiLicenseInfo[]> | null = null;

    let publicDomainMark =
        '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="h-6 w-6 me-[-4px] mb-1 ms-[-4px] scale-[55%]" style="display:inline;" viewBox="0 0 496 512"><path d="M248 8C111 8 0 119.1 0 256c0 137 111 248 248 248s248-111 248-248C496 119.1 385 8 248 8zm0 449.5c-139.2 0-235.8-138-190.2-267.9l78.8 35.1c-2.1 10.5-3.3 21.5-3.3 32.9 0 99 73.9 126.9 120.4 126.9 22.9 0 53.5-6.7 79.4-29.5L297 311.1c-5.5 6.3-17.6 16.7-36.3 16.7-37.8 0-53.7-39.9-53.9-71.9 230.4 102.6 216.5 96.5 217.9 96.8-34.3 62.4-100.6 104.8-176.7 104.8zm194.2-150l-224-100c18.8-34 54.9-30.7 74.7-11l40.4-41.6c-27.1-23.3-58-27.5-78.1-27.5-47.4 0-80.9 20.5-100.7 51.6l-74.9-33.4c36.1-54.9 98.1-91.2 168.5-91.2 111.1 0 201.5 90.4 201.5 201.5 0 18-2.4 35.4-6.8 52-.3-.1-.4-.2-.6-.4z"/></svg>';

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

    function calculateAdaptedLicenseDescription(licenseInfo: ApiLicenseInfo) {
        return $translate('page.about.license.adaptedInLanguages.value', {
            values: {
                title: licenseInfo.title,
                languages: $supportedLanguages.map((language) => language.displayName).join(', '),
                copyright:
                    licenseInfo.copyright.holder.name.replaceAll(' ', '').toLowerCase() === 'publicdomain'
                        ? publicDomainMark
                        : '<span>©</span>',
                date: licenseInfo.copyright.dates ? licenseInfo.copyright.dates : '',
                publisher: licenseInfo.copyright.holder.name,
                bnLicense: 'CC BY-SA 4.0',
            },
        });
    }

    function getOtherLicenses() {
        return [
            {
                title: 'UBS Dictionary of the Greek New Testament',
                copyright: {
                    dates: '2023',
                    holder: {
                        name: 'United Bible Societies',
                        url: 'https://unitedbiblesocieties.org/',
                    },
                },
                licenses: [
                    {
                        eng: {
                            name: 'CC BY-SA 4.0 license',
                            url: 'https://creativecommons.org/licenses/by-sa/4.0/legalcode.en',
                        },
                    },
                ],
            },
        ];
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
                .concat(getOtherLicenses())
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
                                        <span class="whitespace-nowrap">
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
                        <div class="ms-4 mt-4">
                            {@html calculateAdaptedLicenseDescription(licenseInfo)}
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
