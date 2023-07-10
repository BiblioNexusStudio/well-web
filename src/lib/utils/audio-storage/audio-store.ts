import DB from './db';

export type Chunk = {
    id: string;
    name: string;
    rate: number;
    seconds: number;
    length: number;
    channels: (ChunkData | SafariChunkData)[];
};
type ChunkData = Blob | Float32Array;
type SafariChunkData = string;
export type Metadata = {
    name: string;
    channels: number;
    rate: number;
    duration: number;
    chunks: number;
};

export default class AudioStore {
    ac: AudioContext;
    db: DB;
    duration: number;
    blobs: boolean;

    constructor(ac: AudioContext) {
        this.ac = ac;
        this.db = new DB();
        this.duration = 5;
        // mobile Safari throws up when saving blobs to indexeddb :(
        this.blobs = !/iP(ad|hone|pd)/.test(navigator.userAgent);
    }

    async init() {
        await this.db.init();
        return this;
    }

    async getChunk(name: string, seconds: number): Promise<Chunk> {
        if (seconds % this.duration !== 0) {
            const msg = `${seconds} is not divisible by ${this.duration}`;
            throw new Error(msg);
        }

        const id = `${name}-${seconds}`;
        const chunk = (await this.db.getRecord('chunks', id)) as Chunk;

        return this.parseChunk(chunk);
    }

    async parseChunk(chunk: Chunk): Promise<Chunk> {
        return new Promise((resolve, reject) => {
            if (!this.blobs) {
                chunk.channels = chunk.channels.map((channel) => {
                    return this.stringToFloat32Array(channel as string);
                });
                resolve(chunk);
            } else {
                const channels = [] as Float32Array[];

                let count = 0;

                for (let i = 0; i < chunk.channels.length; ++i) {
                    const reader = new FileReader();

                    reader.onload = function () {
                        if (this.result) {
                            channels[i] = new Float32Array(this.result as ArrayBuffer);
                        }

                        if (++count === chunk.channels.length) {
                            chunk.channels = channels;
                            resolve(chunk);
                        }
                    };

                    reader.onerror = reject;

                    reader.readAsArrayBuffer(chunk.channels[i] as unknown as Blob);
                }
            }
        });
    }

    async saveMetadata(metadata: Metadata) {
        return this.db.saveRecords('metadata', [metadata]);
    }

    async saveChunks(records: Chunk[]) {
        return this.db.saveRecords('chunks', records);
    }

    audioBufferToMetadata(name: string, ab: AudioBuffer): Metadata {
        const channels = ab.numberOfChannels;
        const rate = ab.sampleRate;
        const duration = ab.duration;
        const chunks = Math.ceil(duration / this.duration);
        return { name, channels, rate, duration, chunks };
    }

    audioBufferToRecords(name: string, ab: AudioBuffer) {
        const channels = ab.numberOfChannels;
        const rate = ab.sampleRate;
        const chunk = rate * this.duration;
        const samples = ab.duration * rate;
        const records = [];
        const channelData = [];

        for (let i = 0; i < channels; ++i) {
            channelData.push(ab.getChannelData(i));
        }

        for (let offset = 0; offset < samples; offset += chunk) {
            const length = Math.min(chunk, samples - offset);
            const seconds = offset / ab.sampleRate;
            const id = `${name}-${seconds}`;
            const record = { id, name, rate, seconds, length, channels: [] } as Chunk;

            record.channels = channelData.map((data) => {
                // 4 bytes per 32-bit float...
                const byteOffset = offset * 4;
                const buffer = new Float32Array(data.buffer, byteOffset, length);

                if (!this.blobs) {
                    return this.float32ArrayToString(buffer);
                } else {
                    return new Blob([buffer]);
                }
            });

            records.push(record);
        }

        return records;
    }

    mergeChunks(chunks: Chunk[], metadata: Metadata, start: number, end: number): AudioBuffer {
        const merged = [] as ChunkData[];
        const length = chunks.reduce((a, b) => a + b.length, 0);
        const samples = end - start;
        const rate = metadata.rate;

        for (let i = 0; i < metadata.channels; ++i) {
            merged[i] = new Float32Array(length);
        }

        for (let i = 0, index = 0; i < chunks.length; ++i) {
            merged.forEach((_channel, j) => {
                (merged[j] as Float32Array).set(chunks[i].channels[j] as ArrayLike<number>, index);
            });
            index += chunks[i].length;
        }

        const channels = merged.map((f32) => (f32 as Float32Array).subarray(start, end));
        const ab = this.ac.createBuffer(channels.length, samples, rate);

        channels.forEach((f32, i) => ab.getChannelData(i).set(f32));

        return ab;
    }

    float32ArrayToString(f32: Float32Array) {
        const { byteOffset, byteLength } = f32;

        const i16 = new Uint16Array(f32.buffer, byteOffset, byteLength / 2);

        // this is WAY faster when we can use it
        if ('TextDecoder' in window) {
            const decoder = new TextDecoder('utf-16');
            return decoder.decode(i16);
        }

        let str = '';

        // reduce string concatenations by getting values for a bunch of
        // character codes at once. can't do 'em all in one shot though,
        // because we'll blow out the call stack.
        for (let i = 0, len = i16.byteLength; i < len; i += 10000) {
            const length = Math.min(i + 10000, len - i);
            str += String.fromCharCode.apply(null, i16.subarray(i, length) as unknown as number[]);
        }

        return str;
    }

    stringToFloat32Array(str: string): Float32Array {
        const i16 = new Uint16Array(str.length);

        for (let i = 0, len = i16.length; i < len; ++i) {
            i16[i] = str.charCodeAt(i);
        }

        const f32 = new Float32Array(i16.buffer);

        return f32;
    }

    async getMetadata(name: string): Promise<Metadata> {
        return this.db.getRecord('metadata', name) as Promise<Metadata>;
    }

    async saveAudioBuffer(name: string, ab: AudioBuffer) {
        console.info(`saving audiobuffer ${name}`);

        const chunks = this.audioBufferToRecords(name, ab);
        const metadata = this.audioBufferToMetadata(name, ab);

        await this.saveChunks(chunks);
        await this.saveMetadata(metadata);

        console.info(`saved audiobuffer ${name}`);

        return metadata;
    }

    async getAudioBuffer(name: string, offset = 0, duration = 10) {
        const start = offset;
        const end = offset + duration;
        const log = `getting audiobuffer ${name} @ ${start}s-${end}s`;

        console.info(log);

        const metadata = await this.getMetadata(name);

        if (offset + duration > metadata.duration) {
            const msg = `${end} is beyond track duration ${metadata.duration}`;
            throw new Error(msg);
        }

        const rate = metadata.rate;
        const seconds = Math.floor(offset / this.duration) * this.duration;
        const samples = Math.ceil(duration * rate);
        const promises = [];

        offset -= seconds;

        const first = Math.floor(offset * rate);
        const last = first + samples;

        let sec = seconds;

        while (sec - offset < seconds + duration) {
            promises.push(this.getChunk(name, sec));
            sec += this.duration;
        }

        const chunks = await Promise.all(promises);
        const ab = this.mergeChunks(chunks, metadata, first, last);
        const msg = `got audiobuffer ${name} @ ${start}s-${end}s`;

        console.info(msg);

        return ab;
    }
}
