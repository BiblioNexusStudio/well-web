import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'bible.well',
    appName: 'Bible Well',
    webDir: 'build',
    server: {
        androidScheme: 'https',
    },
};

export default config;
