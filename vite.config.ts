import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

const kitConfig = {
    adapterFallback: '/index.html',
};

export default defineConfig({
    plugins: [
        sveltekit(),
        SvelteKitPWA({
            registerType: 'autoUpdate',
            injectRegister: null,
            workbox: {
                globPatterns: ['client/**/*.{html,js,css,ico,png,svg,webp,webmanifest}'],
                additionalManifestEntries: [{ url: '/', revision: null }],
                navigateFallback: '/',
                runtimeCaching: [
                    {
                        urlPattern: /\/.*-config\.json$/,
                        handler: 'StaleWhileRevalidate',
                    },
                    {
                        // TODO: update this with the Aquifer API URL
                        urlPattern: /.*/,
                        handler: 'StaleWhileRevalidate',
                        method: 'GET',
                        options: {
                            cacheName: 'aquifer-api',
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        // TODO: update this with the base Aquifer file storage URL
                        urlPattern: /https:\/\/s3.*/,
                        handler: 'StaleWhileRevalidate',
                        method: 'GET',
                        options: {
                            cacheName: 'aquifer-media',
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],

                // this prevents a warning
                modifyURLPrefix: {},
            },
            kit: kitConfig,
            manifest: {
                short_name: 'Aquifer',
                name: 'Aquifer',
                icons: [
                    {
                        src: 'aquifer-logo-512.png',
                        type: 'image/png',
                        sizes: '512x512',
                    },
                    {
                        src: 'aquifer-logo-192.png',
                        type: 'image/png',
                        sizes: '192x192',
                    },
                    {
                        src: 'aquifer-logo-64.png',
                        type: 'image/png',
                        sizes: '64x64 32x32 24x24 16x16',
                    },
                ],
                display: 'standalone',
                start_url: '/',
                theme_color: '#000000',
                background_color: '#ffffff',
            },
        }),
    ],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/setup-tests.ts'],
        include: ['src/**/*.{test,spec}.{js,ts}'],
    },
});
