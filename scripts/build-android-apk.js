import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { parseArgs, preloadFiles } from './preload-files-to-static.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const tmpDir = path.join(projectRoot, 'tmp');

const password = 'password';
const keyStoreAlias = 'bible.well';

const keystorePaths = {
    base64: path.join(tmpDir, 'keystore.jks.base64'),
    jks: path.join(tmpDir, 'keystore.jks'),
};

function removeFiles() {
    Object.values(keystorePaths).forEach((file) => fs.rmSync(file, { force: true }));
}

try {
    removeFiles();

    console.log('\nBuilding...');
    execSync('yarn build');

    console.log('\nPreloading static files...');
    await preloadFiles(process.env.PUBLIC_AQUIFER_API_URL, { ...parseArgs(process.argv), cleanDir: true });

    console.log('\nGenerating assets...');
    execSync('npx capacitor-assets generate --android');

    console.log('\nSyncing to Android project...');
    execSync('npx cap sync android');

    console.log('\nGetting signing key from Azure Key Vault...');
    execSync(
        `az keyvault secret download --name bible-well-android-release-keystore --vault-name biblionexus-kv-prod --file ${keystorePaths.base64}`
    );
    const base64Data = fs.readFileSync(keystorePaths.base64, 'utf8');
    fs.writeFileSync(keystorePaths.jks, Buffer.from(base64Data, 'base64'));

    console.log('\nBuilding APK...');
    const build = spawnSync(
        'npx',
        [
            'cap',
            'build',
            'android',
            '--keystorepath',
            keystorePaths.jks,
            '--keystorepass',
            password,
            '--keystorealias',
            keyStoreAlias,
            '--keystorealiaspass',
            password,
            '--androidreleasetype',
            'APK',
        ],
        { stdio: 'inherit' }
    );

    if (build.status !== 0) throw new Error('Build failed');
} catch (error) {
    console.error('Build failed:', error);
} finally {
    removeFiles();
}
