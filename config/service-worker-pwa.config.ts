import type { SvelteKitPWAOptions } from '@vite-pwa/sveltekit/*';

const buildTimestamp = new Date().toISOString();

export const serviceWorkerPwaConfig = {
    registerType: 'autoUpdate',
    injectRegister: null,
    workbox: {
        globPatterns: ['client/**/*.{html,js,css,ico,png,svg,webp,webmanifest}'],
        additionalManifestEntries: [{ url: '/', revision: buildTimestamp }],
        navigateFallback: '/',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
            {
                urlPattern: /https:\/\/aquifer-server-(qa|dev|prod)\.azurewebsites\.net.*/,
                handler: 'CacheFirst',
                method: 'GET',
                options: {
                    cacheName: 'aquifer-api',
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                },
            },
            {
                urlPattern: /https:\/\/cdn\.aquifer\.bible.*/,
                handler: 'CacheFirst',
                method: 'GET',
                options: {
                    cacheName: 'aquifer-cdn',
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                },
            },
        ],

        // this prevents a warning
        modifyURLPrefix: {},
    },
    kit: {
        adapterFallback: '/index.html',
    },
    manifest: {
        id: 'org.biblionexus.aquifer',
        short_name: 'Aquifer',
        name: 'Aquifer',
        description: 'Aquifer',
        display: 'standalone',
        display_override: ['standalone', 'browser', 'minimal-ui', 'window-controls-overlay'],
        icons: [
            {
                src: 'aquifer-logo-512.png',
                type: 'image/png',
                sizes: '512x512',
                purpose: 'any',
            },
            {
                src: 'aquifer-logo-192.png',
                type: 'image/png',
                sizes: '192x192',
                purpose: 'any',
            },
            {
                src: 'aquifer-logo-64.png',
                type: 'image/png',
                sizes: '64x64 32x32 24x24 16x16',
                purpose: 'any',
            },
        ],
        start_url: '/',
        theme_color: '#3ABFF8',
        background_color: '#0F1729',
        categories: ['reference', 'books'],
        edge_side_panel: {},
        file_handlers: [],
        handle_links: 'auto',
        launch_handler: { client_mode: 'auto' },
        orientation: 'portrait',
        prefer_related_applications: false,
        screenshots: [],
    },
} as SvelteKitPWAOptions;