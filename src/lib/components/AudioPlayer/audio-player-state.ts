import { writable } from 'svelte/store';

export interface AudioFileInfo {
    url: string;
    type: 'webm' | 'mp3';
    startTime: number;
    endTime?: number | null;
}

// This class encapsulates a single "instance" of an audio player that can play one or more audio clip in sequence,
// seamlessly. One or more of these states can be passed into the AudioPlayer. Instead of instantiating directly, use
// the createMultiClipAudioState function below to return a Svelte-store-ized version that's easy to use in the UI.
//
// Under the hood this will keep track of each of the files to be included in the clip sequence, including their
// HTMLAudioElement instances.
class _MultiClipAudioState {
    currentClipIndex: number;
    clipSequence: _AudioClip[];
    syncSeekPositionTimer: ReturnType<typeof setInterval> | null;
    _rangeValue: number;
    _timeDisplay: string;
    _totalTimeDisplay: string;

    constructor(files: AudioFileInfo[]) {
        this.currentClipIndex = 0;
        this.syncSeekPositionTimer = null;
        this._rangeValue = 0;
        this._timeDisplay = '00:00';
        this._totalTimeDisplay = '00:00';
        this.clipSequence = files.map(
            (file, index) =>
                new _AudioClip(file, {
                    onload: this.onloadFactory(index),
                    onplay: this.onplayFactory(index),
                    onended: this.onendedFactory(index),
                    onpause: this.onpauseFactory(index),
                })
        );
    }

    playOrPause() {
        this.currentClip().isPlaying ? this.pauseAllClips() : this.currentClip().play();
        this.calculateDisplayAndNotifyStateChanged();
    }

    pauseAllClipsAndNotify() {
        this.pauseAllClips();
        this.calculateDisplayAndNotifyStateChanged();
    }

    onRangeChange(e: Event) {
        this.stopSyncingSeekPosition();
        const value = (e.target as HTMLInputElement).value;
        const newTime = (parseInt(value) / 100) * this.totalDuration();
        let previousClipDurations = 0;
        let newClipIndex = 0;
        const isPlaying = this.currentClip().isPlaying;

        for (; newClipIndex < this.clipSequence.length; newClipIndex++) {
            const clipTotalTime = this.clipSequence[newClipIndex].totalTime || 0;
            if (previousClipDurations + clipTotalTime >= newTime) break;
            previousClipDurations += clipTotalTime;
        }

        if (newClipIndex !== this.currentClipIndex) {
            this.currentClipIndex = newClipIndex;
        }

        this.currentClip().updateRealSeekedTimeToClipAdjustedTime(newTime - previousClipDurations);

        if (isPlaying) {
            this.pauseAllClips();
            this.currentClip().play();
        }
        this.calculateDisplayAndNotifyStateChanged();
    }

    isPlaying() {
        return this.currentClip().isPlaying;
    }

    rangeValue() {
        return this._rangeValue;
    }

    timeDisplay() {
        return this._timeDisplay;
    }

    totalTimeDisplay() {
        return this._totalTimeDisplay;
    }

    onDestroy() {
        this.clipSequence.forEach((state) => state.destroy());
        this.stopSyncingSeekPosition();
        this.calculateDisplayAndNotifyStateChanged();
    }

    // Private methods below

    currentClip() {
        return this.clipSequence[this.currentClipIndex];
    }

    totalDuration() {
        return this.clipSequence.reduce((acc, state) => {
            return acc + (state.totalTime || 0);
        }, 0);
    }

    allFilesLoaded() {
        return this.clipSequence.every(({ loading }) => !loading);
    }

    pauseAllClips() {
        this.clipSequence.forEach((state) => state.pause());
    }

    startSyncingSeekPosition() {
        if (this.syncSeekPositionTimer) return;
        this.syncSeekPositionTimer = setInterval(() => {
            this.currentClip().syncRealSeekedTime();
            this.currentClip().checkPlaybackLimits();
            this.calculateDisplayAndNotifyStateChanged();
        }, 50);
    }

    stopSyncingSeekPosition() {
        if (!this.syncSeekPositionTimer) return;
        clearInterval(this.syncSeekPositionTimer);
        this.syncSeekPositionTimer = null;
    }

    onplayFactory(index: number) {
        return () => {
            this.clipSequence[index].isPlaying = true;
            this.startSyncingSeekPosition();
            this.calculateDisplayAndNotifyStateChanged();
        };
    }

    onpauseFactory(index: number) {
        return () => {
            this.clipSequence[index].isPlaying = false;
            this.stopSyncingSeekPosition();
            this.calculateDisplayAndNotifyStateChanged();
        };
    }

    onendedFactory(index: number) {
        return () => {
            this.clipSequence[index].isPlaying = false;
            if (this.clipSequence[index + 1]) {
                this.currentClipIndex = index + 1;
                this.clipSequence[index + 1].resetRealSeekedTimeToStartTime();
                this.currentClip().play();
            } else {
                this.currentClipIndex = 0;
                this.clipSequence[0].resetRealSeekedTimeToStartTime();
                this.stopSyncingSeekPosition();
            }
            this.calculateDisplayAndNotifyStateChanged();
        };
    }

    onloadFactory(index: number) {
        return () => {
            this.clipSequence[index].fileLoaded();
            this.calculateDisplayAndNotifyStateChanged();
        };
    }

    formatTime(totalSeconds: number) {
        totalSeconds = Math.floor(totalSeconds);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    calculateDisplayAndNotifyStateChanged() {
        const currentDuration =
            this.clipSequence.slice(0, this.currentClipIndex).reduce((acc, state) => {
                return acc + (state.totalTime || 0);
            }, 0) + this.currentClip().clipAdjustedTime();
        const totalDuration = this.totalDuration();
        this._totalTimeDisplay = this.formatTime(totalDuration);
        this._rangeValue = 100 * (currentDuration / totalDuration);
        this._timeDisplay = this.formatTime(currentDuration);
        this._notifyStateChanged();
    }

    // This function tells the store that an update happened. It does not change state itself.
    _notifyStateChanged() {
        // Overridden below during store creation
    }
}

export type MultiClipAudioState = ReturnType<typeof createMultiClipAudioState>;

// Create a new MultiClipAudioState given the list of files.
// Gives access to a subscribe method for components to see updates.
// Also injects a notifyStateChanged method that will cause the subscribers to be called.
export function createMultiClipAudioState(files: AudioFileInfo[]) {
    const state = new _MultiClipAudioState(files);
    const { subscribe, update } = writable(state);

    // This function tells the store that an update happened. It does not change state itself.
    state._notifyStateChanged = () => {
        update((state) => state);
    };

    // The bind(state) is necessary to make sure the functions have access to `this`
    return {
        subscribe,
        playOrPause: state.playOrPause.bind(state),
        onRangeChange: state.onRangeChange.bind(state),
        onDestroy: state.onDestroy.bind(state),
        stopSyncingSeekPosition: state.stopSyncingSeekPosition.bind(state),
        rangeValue: state.rangeValue.bind(state),
        timeDisplay: state.timeDisplay.bind(state),
        totalTimeDisplay: state.totalTimeDisplay.bind(state),
        isPlaying: state.isPlaying.bind(state),
        allFilesLoaded: state.allFilesLoaded.bind(state),
        pauseAllClipsAndNotify: state.pauseAllClipsAndNotify.bind(state),
    };
}

// A single audio clip, backed by a file that optionally includes a start and end time.
// This will keep track of the current state of the clip including its HTMLAudioElement instance.
type AudioClipCallbacks = { onload: () => void; onplay: () => void; onpause: () => void; onended: () => void };
class _AudioClip {
    file: AudioFileInfo;
    realSeekedTime: number;
    isPlaying: boolean;
    totalTime: number | null;
    loading: boolean;
    hasCustomTime: boolean;
    audioElement: HTMLAudioElement;
    startTime: number;
    endTime: number | null;
    callbacks: AudioClipCallbacks;

    constructor(file: AudioFileInfo, callbacks: AudioClipCallbacks) {
        this.file = file;
        this.realSeekedTime = file.startTime;
        this.isPlaying = false;
        this.totalTime = null;
        this.loading = true;
        this.startTime = file.startTime;
        this.endTime = file.endTime !== null && file.endTime !== undefined ? file.endTime - 0.1 : null;
        this.hasCustomTime = this.endTime !== null;
        this.callbacks = callbacks;

        this.audioElement = new Audio();
        this.audioElement.oncanplaythrough = callbacks.onload;
        this.audioElement.onplay = callbacks.onplay;
        this.audioElement.onpause = callbacks.onpause;
        this.audioElement.onended = callbacks.onended;
        this.audioElement.src = file.url;
        this.audioElement.load();
    }

    checkPlaybackLimits() {
        if (this.hasCustomTime && this.audioElement.currentTime >= (this.endTime || this.audioElement.duration)) {
            this.audioElement.pause();
            this.audioElement.onended && this.audioElement.onended(new Event('onended'));
        }
    }

    syncRealSeekedTime() {
        this.realSeekedTime = this.audioElement.currentTime;
    }

    updateRealSeekedTimeToClipAdjustedTime(clipAdjustedTime: number) {
        this.realSeekedTime = clipAdjustedTime + this.startTime;
    }

    resetRealSeekedTimeToStartTime() {
        this.realSeekedTime = this.startTime;
    }

    fileLoaded() {
        this.loading = false;
        this.totalTime = this.hasCustomTime ? this.endTime! - this.startTime : this.audioElement.duration;
    }

    clipAdjustedTime() {
        return this.realSeekedTime - this.startTime;
    }

    play() {
        if (this.isPlaying) return;

        if (
            this.audioElement.currentTime < this.startTime ||
            this.audioElement.currentTime > (this.endTime || this.audioElement.duration)
        ) {
            this.realSeekedTime = this.startTime;
        }

        this.audioElement.currentTime = this.realSeekedTime;
        this.audioElement.play();
    }

    pause() {
        this.isPlaying = false;
        this.audioElement.pause();
    }

    destroy() {
        this.audioElement.remove();
        this.audioElement.pause();

        this.audioElement.src = '';
        this.audioElement.load();

        this.audioElement.removeEventListener('canplaythrough', this.callbacks.onload);
        this.audioElement.removeEventListener('play', this.callbacks.onplay);
        this.audioElement.removeEventListener('pause', this.callbacks.onpause);
        this.audioElement.removeEventListener('ended', this.callbacks.onended);

        if (this.audioElement.parentNode) {
            this.audioElement.parentNode.removeChild(this.audioElement);
        }

        URL.revokeObjectURL(this.file.url);
        this.audioElement = null!;
    }
}
