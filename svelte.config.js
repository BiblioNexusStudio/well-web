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
    },
    preprocess: vitePreprocess(),
};

export default config;
