import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: 'index.html',
            serviceWorker: {
                register: false,
            },
            files: {
                serviceWorker: 'src/service-worker.ts',
            },
        }),
        output: { preloadStrategy: 'disabled' },
        typescript: {
            config: (config) => ({
                ...config,
                include: [...config.include, '../static/js/caching-config.js', '../static/js/workbox-plugins/*.js'],
                exclude: config.exclude.filter((e) => e !== '../src/service-worker.ts'),
            }),
        },
    },
    preprocess: vitePreprocess(),
};

export default config;
