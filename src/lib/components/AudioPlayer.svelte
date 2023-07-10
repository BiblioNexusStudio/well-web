<script lang="ts">
    declare global {
        interface Window {
            webkitAudioContext: AudioContext;
        }
    }

    import AudioStore from '$lib/utils/audio-storage/audio-store';
    import Player from '$lib/utils/audio-storage/player';
    import StreamCoordinator from '$lib/utils/audio-storage/stream-coordinator';

    import { onMount } from 'svelte';

    let el: HTMLDivElement;
    let logs: HTMLDivElement;
    let ac: AudioContext;
    let store: AudioStore;
    let streamer: StreamCoordinator;
    const info = console.info;

    onMount(async () => {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        store = new AudioStore(ac);
        streamer = new StreamCoordinator(url, store);

        console.info = (str: string) => {
            requestAnimationFrame(() => {
                const pre = document.createElement('pre');
                pre.textContent = `${str}\n`;
                if (logs) {
                    logs.appendChild(pre);
                    logs.scrollTop = Math.pow(2, 53) - 1;
                }
                info.call(console, str);
            });
        };

        // initialize the database
        await store.init();
        // load all audio assets
        await streamer.load();
        // set up the player
        new Player(el, streamer);
    });

    export let url: string;
</script>

<div class="player" bind:this={el}>
    <p class="message" />
    <div class="controls">
        <button class="button fa fa-play" />
        <div class="track">
            <div class="progress" />
            <div class="scrubber" />
        </div>
    </div>
</div>

<div class="logs" bind:this={logs} />

<style>
    .player {
        margin: 0 auto;
        width: 300px;
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
    }

    .message {
        height: 20px;
        text-align: center;
        font-family: Helvetica, Arial, sans-serif;
    }

    .controls {
        background: #333;
        padding: 12px 8px;
    }

    .button {
        color: white;
        width: 20px;
        margin: 3px 0 0 0;
        font-size: 16px;
        text-align: center;
        display: inline-block;
        cursor: pointer;
        background: transparent;
        border: none;
        outline: none;
    }

    .track {
        position: relative;
        width: 226px;
        margin: 7px 0 0 16px;
        height: 10px;
        border: 1px solid #666;
        display: inline-block;
        vertical-align: top;
    }

    .progress {
        position: absolute;
        width: 0%;
        height: 100%;
        background: #f00;
    }

    .scrubber {
        position: absolute;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        margin: -4px 0 0 -9px;
        background: #f00;
        border: solid 3px #ddd;
        cursor: pointer;
        box-shadow: 0 0 5px #000, inset 0 0 4px #400;
    }

    .logs {
        display: block;
        max-width: 800px;
        height: 300px;
        margin: 50px auto 0;
        padding: 12px;
        background: #f6f6f6;
        border: 1px solid #555;
        overflow: scroll;
    }

    /* eslint-disable-next-line */
    :global(.logs pre) {
        padding: 4px 0;
        margin: 0;
    }
</style>
