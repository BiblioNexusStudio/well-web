import { Howl, type HowlOptions } from 'howler';
import { writable } from 'svelte/store';

export interface AudioFileInfo {
    url: string;
    startTime: number;
    endTime?: number | null;
}

class AudioPlayerState {
    currentFileIndex: number;
    fileStates: AudioFileState[];
    syncSeekPositionTimer: ReturnType<typeof setInterval> | null;
    _rangeValue: number;
    _timeDisplay: string;

    constructor(files: AudioFileInfo[]) {
        this.currentFileIndex = 0;
        this.syncSeekPositionTimer = null;
        this._rangeValue = 0;
        this._timeDisplay = '';
        this.fileStates = files.map(
            (file, index) =>
                new AudioFileState(file, {
                    onload: this.onloadFactory(index),
                    onplay: this.onplayFactory(index),
                    onend: this.onendFactory(index),
                    onpause: this.onpauseFactory(index),
                })
        );
    }

    playOrPause() {
        this.currentFile.isPlaying ? this.pauseAll() : this.currentFile.play();
        this.notifyStateChanged();
    }

    pauseAudioIfOtherSourcePlaying(activePlayId: number | undefined) {
        if (this.fileStates.some((state) => state.isPlayingAndNotMatchingId(activePlayId))) {
            this.pauseAll();
            this.notifyStateChanged();
        }
    }

    onRangeChange(e: Event) {
        this.stopSyncingSeekPosition();
        const value = (e.target as HTMLInputElement).value;
        const newTime = (parseInt(value) / 100) * this.totalDuration;
        let previousFileDurations = 0;
        let newFileIndex = 0;
        const isPlaying = this.currentFile.isPlaying;

        for (; newFileIndex < this.fileStates.length; newFileIndex++) {
            const fileTotalTime = this.fileStates[newFileIndex].totalTime || 0;
            if (previousFileDurations + fileTotalTime >= newTime) break;
            previousFileDurations += fileTotalTime;
        }

        if (newFileIndex !== this.currentFileIndex) {
            this.currentFileIndex = newFileIndex;
        }

        this.currentFile.updateRealSeekedTimeToClipAdjustedTime(newTime - previousFileDurations);

        if (isPlaying) {
            this.pauseAll();
            this.currentFile.play();
        }
        this.notifyStateChanged();
    }

    get isPlaying() {
        return this.currentFile.isPlaying;
    }

    get rangeValue() {
        return this._rangeValue;
    }

    get timeDisplay() {
        return this._timeDisplay;
    }

    onDestroy() {
        this.fileStates.forEach((state) => state.destroy());
        this.stopSyncingSeekPosition();
        this.notifyStateChanged();
    }

    // Private methods below

    get currentFile() {
        return this.fileStates[this.currentFileIndex];
    }

    get totalDuration() {
        return this.fileStates.reduce((acc, state) => {
            return acc + (state.totalTime || 0);
        }, 0);
    }

    get allFilesLoaded() {
        return this.fileStates.every(({ loading }) => !loading);
    }

    pauseAll() {
        this.fileStates.forEach((state) => state.pause());
    }

    startSyncingSeekPosition() {
        if (this.syncSeekPositionTimer) return;
        this.syncSeekPositionTimer = setInterval(() => {
            this.currentFile.syncRealSeekedTime();
            this.updateRangeAndTimeDisplay();
            this.notifyStateChanged();
        }, 50);
    }

    stopSyncingSeekPosition() {
        if (!this.syncSeekPositionTimer) return;
        clearInterval(this.syncSeekPositionTimer);
        this.syncSeekPositionTimer = null;
    }

    onplayFactory(index: number) {
        return (id: number) => {
            this.fileStates[index].isPlaying = true;
            this.startSyncingSeekPosition();
            this.setActivePlayId(id);
            this.notifyStateChanged();
        };
    }

    onpauseFactory(index: number) {
        return () => {
            this.fileStates[index].isPlaying = false;
            this.stopSyncingSeekPosition();
            this.notifyStateChanged();
        };
    }

    onendFactory(index: number) {
        return () => {
            this.fileStates[index].isPlaying = false;
            if (this.fileStates[index + 1]) {
                this.currentFileIndex = index + 1;
                this.fileStates[index + 1].resetRealSeekedTimeToStartTime();
                this.currentFile.play();
            } else {
                this.stopSyncingSeekPosition();
            }
            this.notifyStateChanged();
        };
    }

    onloadFactory(index: number) {
        return () => {
            this.fileStates[index].fileLoaded();
            this.notifyStateChanged();
        };
    }

    updateRangeAndTimeDisplay() {
        const currentDuration =
            this.fileStates.slice(0, this.currentFileIndex).reduce((acc, state) => {
                return acc + (state.totalTime || 0);
            }, 0) + this.currentFile.clipAdjustedTime();
        this._rangeValue = 100 * (currentDuration / this.totalDuration);
        this._timeDisplay = this.formatTime(currentDuration);
    }

    formatTime(totalSeconds: number) {
        totalSeconds = Math.floor(totalSeconds);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    // This function tells the store that an update happened without changing any state
    notifyStateChanged() {
        // Overridden below during store creation
    }

    setActivePlayId(_activePlayId: number) {
        // Overridden below during store creation
    }
}

export type AudioPlayerStateStore = ReturnType<typeof createAudioPlayerStateStore>;

export function createAudioPlayerStateStore(files: AudioFileInfo[], setActivePlayId: (activePlayId: number) => void) {
    const state = new AudioPlayerState(files);
    const { subscribe, update } = writable(state);

    // This function tells the store that an update happened without changing any state
    state.setActivePlayId = setActivePlayId;
    state.notifyStateChanged = () => {
        update((state) => state);
    };

    // The bind(state) is necessary to make sure the functions have access to `this`
    return {
        subscribe,
        playOrPause: state.playOrPause.bind(state),
        pauseAudioIfOtherSourcePlaying: state.pauseAudioIfOtherSourcePlaying.bind(state),
        onRangeChange: state.onRangeChange.bind(state),
        onDestroy: state.onDestroy.bind(state),
        stopSyncingSeekPosition: state.stopSyncingSeekPosition.bind(state),
        rangeValue: () => state.rangeValue,
        timeDisplay: () => state.timeDisplay,
        isPlaying: () => state.isPlaying,
        allFilesLoaded: () => state.allFilesLoaded,
    };
}

class AudioFileState {
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

    isPlayingAndNotMatchingId(id: number | undefined) {
        return id !== undefined && this.playId !== null && id !== this.playId && this.sound.playing(this.playId);
    }

    destroy() {
        this.sound.unload();
    }
}
