import { isSafariOnMacOrIOS } from '$lib/utils/browser';
import { formatSecondsToTimeDisplay } from '$lib/utils/time';
import type { Unsubscriber } from 'svelte/motion';
import { get, writable } from 'svelte/store';

const playingGlobalId = writable<string | null>(null);

export enum AudioType {
    mp3 = 'mp3',
    webm = 'webm',
}

export interface AudioFileInfo {
    url: string;
    type: AudioType;
    startTime: number;
    endTime?: number | null;
}

class _MultiClipAudioState {
    globalId: string;
    currentClipIndex: number;
    clipSequence: _AudioClip[];
    syncSeekPositionTimer: ReturnType<typeof setInterval> | null;
    seekCooldown = 0;
    _rangeValue: number;
    _timeDisplay: string;
    _totalTimeDisplay: string;
    unsubscribePlayingGlobalId: Unsubscriber | undefined;

    constructor(files: AudioFileInfo[]) {
        this.globalId = Math.random().toString(36).substring(2, 15);
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
        this.unsubscribePlayingGlobalId = playingGlobalId.subscribe((id) => {
            if (id !== null && id !== this.globalId) {
                this.pauseAllClipsAndNotify();
            }
        });
    }

    playOrPause() {
        if (this.currentClip()?.isPlaying) {
            this.pauseAllClips();
            playingGlobalId.set(null);
        } else {
            playingGlobalId.set(this.globalId);
            this.currentClip()?.play();
        }
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
        const isPlaying = this.currentClip()?.isPlaying ?? false;

        for (; newClipIndex < this.clipSequence.length; newClipIndex++) {
            const clipTotalTime = this.clipSequence[newClipIndex]!.totalTime || 0;
            if (previousClipDurations + clipTotalTime >= newTime) break;
            previousClipDurations += clipTotalTime;
        }

        if (newClipIndex !== this.currentClipIndex) {
            this.currentClipIndex = newClipIndex;
        }

        this.currentClip()?.updateRealSeekedTimeToClipAdjustedTime(newTime - previousClipDurations);

        if (isPlaying) {
            this.pauseAllClips();
            this.currentClip()?.play();
        }
        if (isSafariOnMacOrIOS()) {
            // force the seek check to skip 8 cycles (400ms) to let Safari catch up
            this.seekCooldown = 8;
        }
        this.calculateDisplayAndNotifyStateChanged();
    }

    isPlaying() {
        return this.currentClip()?.isPlaying ?? false;
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
        this.unsubscribePlayingGlobalId?.();
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
            this.currentClip()?.checkPlaybackLimits();
            if (this.seekCooldown > 0) {
                this.seekCooldown--;
                return;
            }
            this.currentClip()?.syncRealSeekedTime();
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
            if (this.clipSequence[index]) {
                this.clipSequence[index]!.isPlaying = true;
            }
            playingGlobalId.set(this.globalId);
            this.startSyncingSeekPosition();
            this.calculateDisplayAndNotifyStateChanged();
        };
    }

    onpauseFactory(index: number) {
        return () => {
            if (this.clipSequence[index]) {
                this.clipSequence[index]!.isPlaying = false;
            }
            if (get(playingGlobalId) === this.globalId) {
                playingGlobalId.set(null);
            }
            this.stopSyncingSeekPosition();
            this.calculateDisplayAndNotifyStateChanged();
        };
    }

    onendedFactory(index: number) {
        return () => {
            if (this.clipSequence[index]) {
                this.clipSequence[index]!.isPlaying = false;
                if (this.clipSequence[index + 1]) {
                    this.clipSequence[index]!.pause();
                    this.clipSequence[index]!.resetRealSeekedTimeToStartTime();

                    this.currentClipIndex = index + 1;
                    this.currentClip()?.resetRealSeekedTimeToStartTime();
                    this.currentClip()?.play();
                } else {
                    this.clipSequence[index]!.pause();
                    this.clipSequence[index]!.resetRealSeekedTimeToStartTime();

                    this.currentClipIndex = 0;
                    if (this.clipSequence[0]) {
                        this.clipSequence[0].resetRealSeekedTimeToStartTime();
                    }
                    this.stopSyncingSeekPosition();
                }
            }
            this.calculateDisplayAndNotifyStateChanged();
        };
    }

    onloadFactory(index: number) {
        return () => {
            if (this.clipSequence[index]) {
                this.clipSequence[index]!.fileLoaded();
            }
            this.calculateDisplayAndNotifyStateChanged();
        };
    }

    calculateDisplayAndNotifyStateChanged() {
        const currentDuration =
            this.clipSequence.slice(0, this.currentClipIndex).reduce((acc, state) => {
                return acc + (state.totalTime || 0);
            }, 0) + (this.currentClip()?.clipAdjustedTime() ?? 0);
        const totalDuration = this.totalDuration();
        this._totalTimeDisplay = formatSecondsToTimeDisplay(totalDuration);
        this._rangeValue = 100 * (currentDuration / totalDuration);
        this._timeDisplay = formatSecondsToTimeDisplay(currentDuration);
        this._notifyStateChanged();
    }

    // This function tells the store that an update happened. It does not change state itself.
    _notifyStateChanged() {
        // Overridden below during store creation
    }
}

export type MultiClipAudioState = ReturnType<typeof createMultiClipAudioState>;

/**
 * Creates a new MultiClipAudioState that manages sequential audio playback.
 *
 * The "multi-clip" term means that what appears in the UI like a single audio
 * file can actually be multiple audio files with start/end ranges specified, playing
 * seamlessly in order.
 *
 * @param files - Array of audio files with their respective configuration.
 * @returns An audio player instance with the following capabilities:
 *  - Seamless playback of multiple audio clips in sequence
 *  - Subscription mechanism for state updates via subscribe()
 *  - Automatic state change notifications via notifyStateChanged()
 *  - HTMLAudioElement management for each clip
 *  - Compatible with AudioPlayer component
 *  - Multiple instances can coexist and be swapped
 */
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
    isPlaying = false;
    totalTime: number | null = null;
    loading = true;
    hasCustomTime: boolean;
    audioElement: HTMLAudioElement;
    startTime: number;
    endTime: number | null;
    callbacks: AudioClipCallbacks;
    hasPlayedSome = false;

    constructor(file: AudioFileInfo, callbacks: AudioClipCallbacks) {
        this.file = file;
        this.realSeekedTime = file.startTime;
        this.startTime = Math.round(Math.max(file.startTime - 0.15, 0) * 100) / 100;
        this.endTime =
            file.endTime !== null && file.endTime !== undefined ? Math.round((file.endTime - 0.15) * 100) / 100 : null;
        this.hasCustomTime = this.endTime !== null;
        this.callbacks = callbacks;

        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.audioElement.oncanplaythrough = callbacks.onload;
        this.audioElement.onplay = callbacks.onplay;
        this.audioElement.onpause = callbacks.onpause;
        this.audioElement.onended = callbacks.onended;
        this.audioElement.src = file.url;
        this.audioElement.load();
    }

    checkPlaybackLimits() {
        if (this.hasCustomTime && this.audioElement.currentTime >= (this.endTime || this.audioElement.duration)) {
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
        this.audioElement.currentTime = this.realSeekedTime;
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

        if (this.audioElement.paused && this.audioElement.currentTime === 0) {
            // This means the element hasn't started playing yet
            // Wait for enough data to be buffered before seeking and playing
            this.audioElement.oncanplay = () => {
                if (isSafariOnMacOrIOS()) {
                    this.audioElement.currentTime = this.realSeekedTime - 0.2;
                } else {
                    this.audioElement.currentTime = this.realSeekedTime;
                }
                this.audioElement.play();
                this.audioElement.oncanplay = null; // Cleanup the event listener
            };
            this.audioElement.load();
        } else {
            if (
                this.audioElement.currentTime < this.startTime ||
                this.audioElement.currentTime > (this.endTime || this.audioElement.duration)
            ) {
                this.realSeekedTime = this.startTime;
            }

            this.audioElement.currentTime = this.realSeekedTime;

            this.audioElement.onseeked = () => {
                this.audioElement.play();
                this.audioElement.onseeked = null; // Cleanup the event listener
            };
        }
    }

    pause() {
        this.isPlaying = false;
        this.audioElement.pause();
    }

    destroy() {
        if (this.audioElement) {
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
        }

        URL.revokeObjectURL(this.file.url);
        this.audioElement = null!;
    }
}
