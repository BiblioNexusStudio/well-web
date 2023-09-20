import type { Howl } from 'howler';

export interface AudioFileInfo {
    url: string;
    startTime: number;
    endTime?: number | null;
}
export interface AudioPlayState {
    currentTimeInFile: number;
    isPlaying: boolean;
    playId: number | null;
    totalTime: number | null;
    loading: boolean;
    hasCustomTime: boolean;
    sound: Howl;
}
