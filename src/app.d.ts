// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        interface Error {
            message: string;
        }
        // interface Locals {}
        // interface PageData {}
        // interface Platform {}
    }

    interface Window {
        __CONFIG: Record<string, string | number | boolean>;
        webkitAudioContext: AudioContext;
    }
}

export {};
