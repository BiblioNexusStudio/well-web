import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configName = process.argv[2];
fs.copyFileSync(
    join(__dirname, '../src/env', `${configName}-config.js`),
    join(__dirname, '../static', 'env-config.js')
);
