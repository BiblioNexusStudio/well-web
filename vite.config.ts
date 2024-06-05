import dotenv from 'dotenv';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { serviceWorkerPwaConfig } from './config/service-worker-pwa.config';

dotenv.config();

export default defineConfig({
    define: {
        'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"',
        'process.env.DEPLOY_ENV': JSON.stringify(process.env.DEPLOY_ENV),
        'process.env.PUBLIC_AQUIFER_API_KEY': JSON.stringify(process.env.PUBLIC_AQUIFER_API_KEY),
    },
    resolve: {
        preserveSymlinks: true,
    },
    plugins: [sveltekit(), SvelteKitPWA(serviceWorkerPwaConfig)],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/setup-tests.ts'],
        include: ['src/**/*.{test,spec}.{js,ts}'],
    },
});
