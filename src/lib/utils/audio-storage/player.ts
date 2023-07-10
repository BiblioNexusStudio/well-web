import type StreamCoordinator from './stream-coordinator';

export default class Player {
    el: HTMLElement;
    streamer: StreamCoordinator;
    button: HTMLElement | null;
    track: HTMLElement | null;
    progress: HTMLElement | null;
    scrubber: HTMLElement | null;
    message: HTMLElement | null;
    playing: boolean;
    position: number | undefined;
    dragging: boolean;
    startX: number | undefined;
    startLeft: number | undefined;

    constructor(el: HTMLElement, streamer: StreamCoordinator) {
        this.el = el;
        this.streamer = streamer;
        this.button = el.querySelector('.button');
        this.track = el.querySelector('.track');
        this.progress = el.querySelector('.progress');
        this.scrubber = el.querySelector('.scrubber');
        this.message = el.querySelector('.message');

        this.bindEvents();
        this.draw();
        this.playing = false;
        this.dragging = false;
    }

    bindEvents() {
        this.button?.addEventListener('click', () => this.toggle());
        this.scrubber?.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.track?.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('mousemove', (e) => this.onDrag(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    play(position: number | undefined) {
        this.pause();
        this.streamer.stream(position);
        this.playing = true;
        return this;
    }

    pause() {
        this.streamer.stop();
        this.playing = false;
        return this;
    }

    seek(position: number) {
        position = Math.min(position, this.streamer.duration ? this.streamer.duration - 0.5 : 0);
        this.streamer.seek(position);
        return this;
    }

    updatePosition(): number {
        this.position = this.streamer.currentTime();
        if (this.streamer.stopped) {
            this.pause();
        }
        return this.position;
    }

    toggle() {
        if (!this.playing) {
            this.play(undefined);
        } else {
            this.pause();
        }
        return this;
    }

    onMouseDown(e: MouseEvent) {
        this.dragging = true;
        this.startX = e.pageX;
        this.startLeft = parseInt(this.scrubber?.style.left || '0', 10);
    }

    onDrag(e: MouseEvent) {
        if (!this.dragging) {
            return;
        }
        const width = this.track?.offsetWidth;
        const position = (this.startLeft ?? 0) + (e.pageX - (this.startX ?? 0));
        const left = Math.max(Math.min(width ?? 0, position), 0);
        console.log({ width, position, left });

        if (this.scrubber) {
            this.scrubber.style.left = `${left}px`;
        }
    }

    onMouseUp(e: MouseEvent) {
        let isClick = false;
        let target = e.target;

        while (target) {
            isClick = isClick || target === this.track;
            target = (target as unknown as { parentElement: HTMLElement }).parentElement;
        }

        if (this.dragging && !isClick) {
            const width = this.track?.offsetWidth ?? 1;
            const left = parseInt(this.scrubber?.style.left || '0', 10);
            const pct = Math.min(left / width, 1);
            const time = (this.streamer.duration ?? 0) * pct;
            this.seek(time);
            this.dragging = false;
            return false;
        }
    }

    onClick(e: MouseEvent) {
        const width = this.track?.offsetWidth ?? 1;
        const offset = this.track?.offsetLeft ?? 0;
        const left = e.pageX - offset;
        const pct = Math.min(left / width, 1);
        const time = (this.streamer.duration ?? 0) * pct;

        this.seek(time);

        if (this.scrubber) {
            this.scrubber.style.left = `${left}px`;
        }

        this.dragging = false;
    }

    draw() {
        const progress = this.updatePosition() / (this.streamer.duration ?? 0);
        const width = this.track?.offsetWidth ?? 0;

        if (this.playing) {
            this.button?.classList.add('fa-pause');
            this.button?.classList.remove('fa-play');
        } else {
            this.button?.classList.add('fa-play');
            this.button?.classList.remove('fa-pause');
        }

        if (this.progress) {
            this.progress.style.width = `${progress * width}px`;
        }

        if (!this.dragging && this.scrubber) {
            this.scrubber.style.left = `${progress * width}px`;
        }

        requestAnimationFrame(() => this.draw());
    }
}
