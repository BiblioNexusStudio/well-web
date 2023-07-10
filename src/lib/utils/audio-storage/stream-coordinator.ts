import type AudioStore from './audio-store';
import Streamer from './streamer';

export default class StreamCoordinator {
    ac: AudioContext;
    store: AudioStore;
    url: string;
    streamer: Streamer;
    garbageBuffer: AudioBuffer | undefined;
    startTime: number | null;
    startOffset: number | null;
    stopped: boolean;
    ready: boolean;
    duration: number | undefined;

    constructor(url: string, store: AudioStore) {
        this.ac = store.ac;
        this.store = store;
        this.url = url;

        this.streamer = new Streamer(this.url, store);

        // throwaway audio buffer
        this.garbageBuffer = this.ac.createBuffer(1, 1, 44100);

        this.startTime = null;
        this.startOffset = null;

        this.stopped = true;
        this.ready = false;
    }

    stream(offset: number | undefined) {
        if (typeof offset !== 'number') {
            offset = this.startOffset !== null ? this.startOffset : 0;
        }

        // mobile browsers require the first AudioBuuferSourceNode#start() call
        // to happen in the same call stack as a user interaction.
        //
        // out Promise-based stuff breaks that, so we try to get ourselves onto
        // a good callstack here and play an empty sound if we haven't done
        // so already
        if (this.garbageBuffer) {
            const src = this.ac.createBufferSource();
            src.buffer = this.garbageBuffer;
            src.start(0);
            delete this.garbageBuffer;
        }

        void this.streamer.prime(offset).then(() => {
            if (this.startTime === null) {
                this.startTime = this.ac.currentTime;
            }

            this.streamer.stream(offset);
        });

        this.stopped = false;
        this.startOffset = offset;

        return this;
    }

    stop() {
        if (this.stopped) {
            return;
        }

        this.streamer.stop();

        this.stopped = true;

        if (this.startTime) {
            const elapsed = this.ac.currentTime - this.startTime;

            this.startTime = null;
            if (this.startOffset) {
                this.startOffset += elapsed;

                if (this.duration && this.startOffset >= this.duration) {
                    this.startOffset = 0;
                }
            }
        }
    }

    currentTime(): number {
        if (this.stopped && this.startOffset) {
            return this.startOffset;
        }

        const start = this.startTime || this.ac.currentTime;
        const offset = this.startOffset || 0;
        const elapsed = this.ac.currentTime - start;

        const current = offset + elapsed;

        if (this.duration && current >= this.duration) {
            this.stop();
            return 0;
        }

        return current;
    }

    seek(offset: number) {
        if (!this.stopped) {
            this.stop();
            this.stream(offset);
        } else {
            this.startOffset = offset;
        }
    }

    async load() {
        await this.streamer.load();

        this.duration = this.streamer.duration;
    }
}
