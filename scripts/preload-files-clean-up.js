import fs from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const targetDirectory = join(__dirname, '../static/cached-data');

// Check if the directory exists before attempting to delete it
if (fs.existsSync(targetDirectory)) {
    fs.rmdirSync(targetDirectory, { recursive: true });
} else {
    console.log(`Directory "${targetDirectory}" does not exist.`);
}

// Replace the contents of ../src/lib/static-urls-map.json with {} src/lib/static-urls-map.json
fs.writeFileSync(join(__dirname, '../src/lib/static-urls-map.json'), '{}\n');
