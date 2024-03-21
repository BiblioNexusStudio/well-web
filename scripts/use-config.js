import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Copy the given env file to the root `.env` file

const configName = process.argv[2];
fs.copyFileSync(join(__dirname, '../config', `.env.global`), join(__dirname, '..', '.env'));
fs.appendFileSync(join(__dirname, '..', '.env'), fs.readFileSync(join(__dirname, '../config', `.env.${configName}`)));

const commitSha = execSync('git rev-parse HEAD').toString().trim();
fs.appendFileSync(join(__dirname, '..', '.env'), `PUBLIC_COMMIT_SHA=${commitSha}\n`);

// For the service to work during local development, output the variables to a JS file in `/static`

const envContent = fs.readFileSync(join(__dirname, '..', '.env'), 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key] = value.replaceAll('"', '');
    return acc;
}, {});

fs.writeFileSync(
    join(__dirname, '..', 'static', 'local-development-env.js'),
    `this.localDevelopmentEnvVars = ${JSON.stringify(envVars, null, 2)};`
);
