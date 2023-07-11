<script>
</script>

<section>
    <div class="aquiferHeader">
        <h1>AQUIFER</h1>
        <h1>AQUIFER</h1>
    </div>
    <form action="/passage" class="form-control w-full max-w-xs space-y-6">
        <select class="select select-info">
            <option disabled selected>Language</option>
            <option>English</option>
            <option>Tok Pisin</option>
        </select>
        <select class="select select-info">
            <option disabled selected>Book</option>
            <option>Matthew</option>
            <option>Mark</option>
            <option>Luke</option>
            <option>John</option>
        </select>
        <select class="select select-info">
            <option disabled selected>Passage</option>
            <option>blah blah blah 1</option>
            <option>blah blah blah 2</option>
            <option>blah blah blah 3</option>
            <option>blah blah blah 4</option>
            <option>blah blah blah 5</option>
            <option>blah blah blah 6</option>
        </select>
        <button class="btn btn-info">Go</button>
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
