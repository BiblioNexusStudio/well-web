export function formatSecondsToTimeDisplay(seconds: number) {
    if (seconds < 0) {
        return '00:00';
    }
    seconds = Math.floor(seconds);
    const displayMinutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const displaySeconds = String(seconds % 60).padStart(2, '0');
    return `${displayMinutes}:${displaySeconds}`;
}
