import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { serviceWorkerPwaConfig } from './config/service-worker-pwa.config';

export default defineConfig({
    plugins: [sveltekit(), SvelteKitPWA(serviceWorkerPwaConfig)],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/setup-tests.ts'],
        include: ['src/**/*.{test,spec}.{js,ts}'],
    },
});
