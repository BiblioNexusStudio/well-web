<script lang="ts">
    import type { PageData } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import { locale } from 'svelte-i18n';

    export let data: PageData;

    let languageSelected: boolean;
    let selectedBook: string;
    let selectedId = 'default';
    $: bookPassages = data.passages.filter((x) => x.book === selectedBook);

    let onLanguageSelected = (e) => {
        languageSelected = true;
        $locale = e.target.value;
    };
</script>

<section>
    <div class="aquiferHeader">
        <h1>AQUIFER</h1>
        <h1>AQUIFER</h1>
    </div>
    <form action="/passage/{selectedId}" class="form-control w-full max-w-xs space-y-6">
        <select on:change={onLanguageSelected} class="select select-info">
            <option disabled selected>{$translate('page.index.language.value')}</option>
            <option value="en">English</option>
            <option value="tpi">Tok Pisin</option>
        </select>

        <select
            bind:value={selectedBook}
            on:change={() => (selectedId = 'default')}
            class="select select-info"
            disabled={!languageSelected}
        >
            <option disabled selected value="default">{$translate('page.index.book.value')}</option>
            {#each data.books as book}
                <option>{book}</option>
            {/each}
        </select>

        <select bind:value={selectedId} class="select select-info" disabled={!bookPassages.length}>
            <option disabled selected value="default">{$translate('page.index.passage.value')}</option>
            {#each bookPassages as { name, id }}
                <option value={id}>{name}</option>
            {/each}
        </select>

        <button class="btn btn-info" disabled={selectedId === 'default'}>{$translate('page.index.go.value')}</button>
    </form>
</section>

<style>
    section {
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: space-evenly;
        flex-direction: column;
    }

    .aquiferHeader h1 {
        color: #fff;
        font-size: 8em;
        position: absolute;
        transform: translate(-50%, -50%);
    }

    .aquiferHeader h1:nth-child(1) {
        color: transparent;
        -webkit-text-stroke: 2px hsl(var(--in));
    }

    .aquiferHeader h1:nth-child(2) {
        color: hsl(var(--in));
        animation: animate 8s ease-in-out infinite;
    }

    @keyframes animate {
        0%,
        100% {
            clip-path: polygon(0% 45%, 16% 44%, 33% 50%, 54% 60%, 70% 61%, 84% 59%, 100% 52%, 100% 100%, 0% 100%);
        }

        50% {
            clip-path: polygon(0% 60%, 15% 65%, 34% 66%, 51% 62%, 67% 50%, 84% 45%, 100% 46%, 100% 100%, 0% 100%);
        }
    }
</style>
