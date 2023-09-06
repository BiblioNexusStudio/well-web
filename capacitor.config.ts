import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'bible.aquifer',
    appName: 'Aquifer',
    webDir: 'build',
    server: {
        androidScheme: 'https',
    },
};

export default config;
