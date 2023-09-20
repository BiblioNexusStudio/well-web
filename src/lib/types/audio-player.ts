import type { Howl } from 'howler';

export interface AudioFileInfo {
    url: string;
    startTime: number;
    endTime?: number | null;
}
export interface AudioPlayState {
    currentTime: number;
    isPlaying: boolean;
    playId: number | null;
    totalTime: number | null;
    loading: boolean;
    sound: Howl;
}
