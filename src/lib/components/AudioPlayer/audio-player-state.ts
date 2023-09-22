import { Howl, type HowlOptions } from 'howler';
import { writable } from 'svelte/store';

export interface AudioFileInfo {
    url: string;
    startTime: number;
    endTime?: number | null;
}

// This class encapsulates a single "instance" of an audio player that can play one or more audio clip in sequence,
// seamlessly. One or more of these states can be passed into the AudioPlayer. Instead of instantiating directly, use
// the createMultiClipAudioState function below to return a Svelte-store-ized version that's easy to use in the UI.
//
// Under the hood this will keep track of each of the files to be included in the clip sequence, including their
// Howler.js instances.
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
                    onend: this.onendFactory(index),
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

    onendFactory(index: number) {
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
// This will keep track of the current state of the clip including its Howler.js instance.
class _AudioClip {
    file: AudioFileInfo;
    realSeekedTime: number;
    isPlaying: boolean;
    playId: number | null;
    totalTime: number | null;
    loading: boolean;
    hasCustomTime: boolean;
    sound: Howl;

    constructor(file: AudioFileInfo, callbacks: object) {
        this.file = file;
        this.realSeekedTime = file.startTime;
        this.isPlaying = false;
        this.playId = null;
        this.totalTime = null;
        this.loading = true;
        this.hasCustomTime = file.endTime !== null && file.endTime !== undefined;

        const howlOptions: HowlOptions = {
            ...callbacks,
            src: file.url,
        };
        if (this.hasCustomTime) {
            howlOptions.sprite = { audioSection: [1000 * file.startTime, 1000 * (file.endTime! - file.startTime)] };
        }
        this.sound = new Howl(howlOptions);
    }

    syncRealSeekedTime() {
        if (this.playId) {
            this.realSeekedTime = this.sound.seek(this.playId);
        }
    }

    updateRealSeekedTimeToClipAdjustedTime(clipAdjustedTime: number) {
        this.realSeekedTime = clipAdjustedTime + this.file.startTime;
    }

    resetRealSeekedTimeToStartTime() {
        this.realSeekedTime = this.file.startTime;
    }

    fileLoaded() {
        this.loading = false;
        this.totalTime = this.hasCustomTime ? this.file.endTime! - this.file.startTime : this.sound.duration();
    }

    clipAdjustedTime() {
        return this.realSeekedTime - this.file.startTime;
    }

    play() {
        if (this.isPlaying) return;

        let playId = this.playId;
        const currentTime = this.realSeekedTime;

        if (playId !== null) {
            this.sound.play(playId);
        } else if (this.hasCustomTime) {
            playId = this.sound.play('audioSection');
            this.playId = playId;
        } else {
            playId = this.sound.play();
            this.playId = playId;
        }
        this.sound.seek(currentTime, playId);
    }

    pause() {
        this.isPlaying = false;
        if (this.playId !== null) {
            this.sound.pause(this.playId);
        }
    }

    destroy() {
        this.sound.unload();
    }
}
