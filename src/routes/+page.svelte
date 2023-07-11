<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;

    let languageSelected: boolean;
    let selectedBook: string;
    let selectedPassage: string;
    let passageNames: string[] = [];

    function setPassageNames() {
        selectedPassage = 'Passage';
        let bookPassages = data.passages.filter((x) => x.book === selectedBook);
        passageNames = bookPassages.map((x) => x.name);
    }
</script>

<section>
    <div class="aquiferHeader">
        <h1>AQUIFER</h1>
        <h1>AQUIFER</h1>
    </div>
    <form action="/passage" class="form-control w-full max-w-xs space-y-6">
        <select on:change={() => (languageSelected = true)} class="select select-info">
            <option disabled selected>Language</option>
            <option>English</option>
            <option>Tok Pisin</option>
        </select>
        <select
            bind:value={selectedBook}
            on:change={setPassageNames}
            class="select select-info"
            disabled={!languageSelected}
        >
            <option disabled selected>Book</option>
            {#each data.books as book}
                <option>{book}</option>
            {/each}
        </select>
        <select
            bind:value={selectedPassage}
            class="select select-info"
            disabled={!passageNames.length}
        >
            <option disabled selected>Passage</option>
            {#each passageNames as passageName}
                <option>{passageName}</option>
            {/each}
        </select>
        <button class="btn btn-info" disabled={selectedPassage === 'Passage'}>Go</button>
    </form>
</section>

<style>
    @import url('https://fonts.googleapis.com/css?family=Poppins:100,200,300,400,500,600,700,800,900');

    /* form {
        display: flex;
        justify-content: space-evenly;
        flex-direction: column;
    } */

    section {
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: space-evenly;
        flex-direction: column;
    }

    .aquiferHeader {
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
            clip-path: polygon(
                0% 45%,
                16% 44%,
                33% 50%,
                54% 60%,
                70% 61%,
                84% 59%,
                100% 52%,
                100% 100%,
                0% 100%
            );
        }

        50% {
            clip-path: polygon(
                0% 60%,
                15% 65%,
                34% 66%,
                51% 62%,
                67% 50%,
                84% 45%,
                100% 46%,
                100% 100%,
                0% 100%
            );
        }
    }
</style>
