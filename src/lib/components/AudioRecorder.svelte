<script lang="ts">
    import { saveRecordingToCache } from '$lib/utils/data-storage';
    import { onDestroy } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { Icon } from 'svelte-awesome';
    import microphone from 'svelte-awesome/icons/microphone';
    import pause from 'svelte-awesome/icons/pause';

    export let canSave = false;

    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let recording: Blob | null = null;
    let duration: number | null = null;
    let state: 'recording' | 'stopped' = 'stopped';
    let noPermission = false;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    function startDurationCounter() {
        noPermission = false;
        duration = 0;
        intervalId = setInterval(() => {
            if (duration !== null) {
                duration += 1;
            }
        }, 1000);
    }

    function stopDurationCounter() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    onDestroy(reset);

    $: totalTime = formatTime(duration);
    $: canSave = !!recorder && state === 'stopped';

    function formatTime(secs: number | null) {
        if (secs === null) {
            return '--:--';
        }
        const minute = 60;
        const hour = 3600;

        const hrs = Math.floor(secs / hour);
        const min = Math.floor((secs % hour) / minute);
        const sec = Math.floor(secs) % minute;

        const hours = hrs < 10 ? `0${hrs}` : hrs;
        const minutes = min < 10 ? `0${min}` : min;
        const seconds = sec < 10 ? `0${sec}` : sec;
        return hours !== '00' ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
    }

    function getMimeType() {
        const mimeTypes = [
            {
                type: 'audio/webm',
                ext: 'webm',
            },
            {
                type: 'audio/mpeg',
                ext: 'mp3',
            },
            {
                type: 'audio/mp4',
                ext: 'mp4',
            },
        ];

        const isSupportedMimeType = ({ type }: { type: string }) => MediaRecorder.isTypeSupported(type);
        const defaultMime = { type: 'audio/mpeg', ext: 'mp3' };

        return ('isTypeSupported' in MediaRecorder && mimeTypes.find(isSupportedMimeType)) || defaultMime;
    }

    async function startRecording() {
        try {
            if (recorder) {
                recorder.resume();
                state = 'recording';
                startDurationCounter();
            } else {
                if (!stream) {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                }
                const chunks: Blob[] = [];

                recorder = new MediaRecorder(stream);

                const options = { type: `${getMimeType().type}` };

                recorder.start(250);

                state = 'recording';

                const handleStopRecording = () => {
                    recording = new Blob(chunks, options);

                    audioContext.close();
                    stream?.getTracks().map((track) => track.stop());
                    state = 'stopped';
                };

                const processChunk = ({ data }: { data: Blob }) => {
                    if (data !== undefined && data.size !== 0) {
                        chunks.push(data);

                        if (duration === null) {
                            startDurationCounter();
                        }
                    }
                };

                recorder.addEventListener('dataavailable', processChunk);
                recorder.addEventListener('stop', handleStopRecording);
            }
        } catch (e: unknown) {
            if ((e as Error).name === 'NotAllowedError') {
                noPermission = true;
            }
        }
    }

    async function pauseRecording() {
        recorder?.pause();
        state = 'stopped';
        stopDurationCounter();
    }

    async function waitForRecordingBlobToBeSet() {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    export async function reset() {
        recorder?.stop();
        await waitForRecordingBlobToBeSet();
        const savedRecording = recording;
        recorder = null;
        recording = null;
        stream = null;
        noPermission = false;
        audioContext.close();
        stopDurationCounter();
        duration = null;
        return savedRecording;
    }

    export async function saveRecording() {
        const savedRecording = await reset();
        if (savedRecording) {
            return await saveRecordingToCache(savedRecording, getMimeType().ext);
        }
    }
</script>

<div class="flex flex-col items-center">
    {#if noPermission}
        <div class="align-middle py-2 text-center text-red-500">
            {$translate('navTop.audioRecordingModal.noPermission.value')}
        </div>
    {:else}
        <div class="align-middle">{totalTime}</div>
    {/if}
    <div>
        {#if state === 'recording'}
            <button class="btn btn-primary btn-circle" on:click={pauseRecording}>
                <Icon data={pause} scale={0.85} />
            </button>
        {:else}
            <button class="btn btn-primary btn-circle" on:click={startRecording}>
                <Icon data={microphone} />
            </button>
        {/if}
    </div>
</div>
