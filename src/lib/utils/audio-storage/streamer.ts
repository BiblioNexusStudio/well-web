import type AudioStore from './audio-store';

export default class Streamer {
    ac: AudioContext;
    store: AudioStore;
    url: string;
    name: string | undefined;
    active: GainNode;
    gain: GainNode;
    garbageBuffer: AudioBuffer | undefined;
    startTime: number | null;
    startOffset: number | null;
    stopped: boolean;
    ready: boolean;
    duration: number | undefined;
    primed: { offset: number; src: AudioBufferSourceNode } | undefined;
    ending: AudioBufferSourceNode | undefined;
    fetchTimer: NodeJS.Timeout | undefined;
    logTimer: NodeJS.Timeout | undefined;

    constructor(url: string, store: AudioStore) {
        this.ac = store.ac;
        this.store = store;
        this.url = url;
        this.name = url.split('/').pop()?.split('.')[0];
        this.active = this.ac.createGain();
        this.gain = this.ac.createGain();

        // throwaway audio buffer
        this.garbageBuffer = this.ac.createBuffer(1, 1, 44100);

        this.startTime = null;
        this.startOffset = null;

        this.stopped = true;
        this.ready = false;

        this.active.connect(this.gain);
        this.gain.connect(this.ac.destination);
    }

    async prime(offset: number) {
        if (typeof offset !== 'number') {
            offset = this.startOffset !== null ? this.startOffset : 0;
        }

        if (!this.ready) {
            throw new Error(`asset ${this.name ?? ''} not loaded`);
        }

        if (this.duration && offset >= this.duration) {
            throw new Error(`${offset} is greater than ${this.duration}`);
        }

        const store = this.store;
        const duration = Math.min(5, this.duration ? this.duration - offset : 0);
        const record = await store.getAudioBuffer(this.name ?? '', offset, duration);
        const src = this.ac.createBufferSource();

        src.buffer = record;

        this.primed = { offset, src };

        return this;
    }

    stream(offset: number | undefined) {
        if (typeof offset !== 'number') {
            offset = this.startOffset !== null ? this.startOffset : 0;
        }

        if (!this.ready) {
            throw new Error(`asset ${this.name ?? ''} not loaded`);
        }

        if (this.stopped === false) {
            throw new Error(`stream ${this.name ?? ''} is already playing`);
        }

        if (this.ending) {
            this.ending.onended = () => {};
            this.ending = undefined;
        }

        if (this.duration && offset >= this.duration) {
            return this.stop();
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

        this.stopped = false;
        this.startOffset = offset;

        console.info(`streaming ${this.name ?? ''} @ ${offset}s`);

        const play = (
            src: AudioBufferSourceNode,
            when: number,
            offset: number,
            output: GainNode
        ) => {
            const logTime = (when - this.ac.currentTime) * 1000;
            const logString = `playing chunk ${this.name ?? ''} @ ${offset}s`;

            this.logTimer = setTimeout(() => console.info(logString), logTime);

            src.connect(output);
            src.start(when);

            const dur = src?.buffer?.duration;

            if (dur) {
                when += dur;
                offset += dur;
            }

            if (this.duration && offset >= this.duration) {
                this.ending = src;
                src.onended = () => this.stop();
                console.info(`end of file ${this.name ?? ''}`);
                return;
            }

            const fetchTime = (when - this.ac.currentTime) * 1000 - 2000;

            this.fetchTimer = setTimeout(() => {
                console.info(`need chunk ${this.name ?? ''} @ ${offset}s`);

                next(when, offset, output);
            }, fetchTime);
        };

        const next = (when = 0, offset = 0, output: GainNode) => {
            const chunkDuration = Math.min(5, this.duration ? this.duration - offset : 0);
            this.store
                .getAudioBuffer(this.name ?? '', offset, chunkDuration)
                .then((record) => {
                    if (this.stopped || output !== this.active) {
                        return;
                    }

                    const ab = record;
                    const src = this.ac.createBufferSource();

                    src.buffer = ab;

                    if (when === 0) {
                        when = this.ac.currentTime;
                    }

                    if (this.startTime === null) {
                        this.startTime = when;
                    }

                    play(src, when, offset, output);
                })
                .catch((err) => console.error(err));
        };

        const primed = this.primed;

        delete this.primed;

        if (primed && primed.offset === offset) {
            return play(primed.src, this.ac.currentTime, offset, this.active);
        }

        next(0, offset, this.active);

        return this;
    }

    stop() {
        if (this.stopped || !this.ready) {
            return;
        }

        this.stopped = true;
        this.active.disconnect();
        this.active = this.ac.createGain();
        this.active.connect(this.gain);

        if (this.startTime && this.startOffset) {
            const elapsed = this.ac.currentTime - this.startTime;

            this.startTime = null;
            this.startOffset += elapsed;
        }

        console.info(`stopping ${this.name ?? ''} @ ${this.startOffset ?? 0}s`);

        if (this.startOffset && this.duration && this.startOffset >= this.duration) {
            this.startOffset = 0;
        }

        clearTimeout(this.fetchTimer);
        clearTimeout(this.logTimer);

        return this;
    }

    currentTime(): number {
        if (this.stopped) {
            return this.startOffset ?? 0;
        }

        const start = this.startTime || this.ac.currentTime;
        const offset = this.startOffset || 0;
        const elapsed = this.ac.currentTime - start;

        return offset + elapsed;
    }

    seek(offset: number) {
        if (!this.stopped) {
            this.stop();
            this.stream(offset);
        } else {
            this.startOffset = offset;
        }
    }

    async load(force = false) {
        if (!force) {
            console.info(`checking cache for ${this.name ?? ''}`);

            try {
                const { duration } = await this.store.getMetadata(this.name ?? '');
                console.info(`cache hit for ${this.name ?? ''}`);
                Object.assign(this, { duration, ready: true });
                return true;
            } catch {
                // no-op
            }
        }

        console.info(`fetching ${this.url}`);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.open('GET', this.url, true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = () => {
                void this.ac.decodeAudioData(
                    xhr.response as ArrayBuffer,
                    (ab) => {
                        this.store.saveAudioBuffer(this.name ?? '', ab).then((metadata) => {
                            this.duration = metadata.duration;
                            console.info(`fetched ${this.url}`);
                            this.ready = true;
                            resolve(true);
                        }, reject);
                    },
                    reject
                );
            };

            xhr.onerror = reject;

            xhr.send();
        });
    }
}
