import type { SvelteKitPWAOptions } from '@vite-pwa/sveltekit/*';

const buildTimestamp = new Date().toISOString();

export const serviceWorkerPwaConfig = {
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'service-worker.ts',
    registerType: 'prompt',
    injectRegister: null,
    devOptions: { enabled: true, type: 'module', suppressWarnings: true },
    injectManifest: {
        globPatterns: ['client/**/*.{html,js,css,ico,png,svg,webp,webmanifest}'],
        additionalManifestEntries: [{ url: '/', revision: buildTimestamp }],
    },
    kit: {
        adapterFallback: '/index.html',
    },
    manifest: {
        id: 'well.bible',
        short_name: 'Bible Well',
        name: 'Bible Well',
        description: 'Bible Well: Fed by Aquifer',
        display: 'standalone',
        display_override: ['standalone', 'browser', 'minimal-ui', 'window-controls-overlay'],
        icons: [
            {
                src: 'logo-512.png',
                type: 'image/png',
                sizes: '512x512',
                purpose: 'any',
            },
            {
                src: 'logo-192.png',
                type: 'image/png',
                sizes: '192x192',
                purpose: 'any',
            },
            {
                src: 'logo-64.png',
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
        dir: 'auto' as unknown,
        screenshots: [],
    },
} as SvelteKitPWAOptions;
