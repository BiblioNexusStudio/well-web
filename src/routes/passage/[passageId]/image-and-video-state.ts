export class ImageState {
    url: string | null = null;
    displayName: string | null = null;
    isLoading = false;
    hasError = false;
    element: HTMLImageElement | null = null;
    active = false;

    constructor() {
        this.reset();
    }

    reset() {
        this.url = null;
        this.displayName = null;
        this.isLoading = false;
        this.hasError = false;
        this.element = null;
        this.active = false;
    }

    activate(url: string, displayName: string | null) {
        this.url = url;
        this.displayName = displayName;
        this.isLoading = true;
        this.active = true;
    }
}

export class VideoState {
    url: string | null = null;
    isLoading = false;
    hasError = false;
    rangeValue = 0;
    currentTime = 0;
    duration = 0;
    isPlaying = false;
    isMuted = false;
    syncingIntervalId: ReturnType<typeof setInterval> | null = null;
    element: HTMLVideoElement | null = null;
    sliderElement: HTMLDivElement | null = null;
    active = false;

    constructor() {
        this.reset();
    }

    reset() {
        this.stopSyncingSeekPosition();
        this.url = null;
        this.isLoading = false;
        this.hasError = false;
        this.rangeValue = 0;
        this.currentTime = 0;
        this.duration = 0;
        this.isPlaying = false;
        this.isMuted = false;
        this.syncingIntervalId = null;
        this.element = null;
        this.sliderElement = null;
        this.active = false;
    }

    activate(url: string) {
        this.url = url;
        this.isLoading = true;
        this.active = true;
    }

    stopSyncingSeekPosition() {
        if (this.syncingIntervalId) {
            clearInterval(this.syncingIntervalId);
        }
    }

    makeVideoFullscreen() {
        if (this.element) {
            const element = this.element;
            setTimeout(() => {
                // eslint-disable-next-line
                // @ts-ignore
                if (element.webkitEnterFullScreen) {
                    // eslint-disable-next-line
                    // @ts-ignore
                    element.webkitEnterFullScreen();
                } else {
                    element.requestFullscreen();
                }
            }, 0);
        }
    }

    toggleMute() {
        if (this.element) {
            this.isMuted = !this.isMuted;
            this.element.muted = !this.element.muted;
        }
    }

    playPauseVideo() {
        if (this.element) {
            if (this.isPlaying) {
                this.element.pause();
            } else {
                this.element.play();
            }
        }
    }
}
