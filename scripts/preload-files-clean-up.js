import fs from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const targetDirectory = join(__dirname, '../static/cached-data');

// Check if the directory exists before attempting to delete it
if (fs.existsSync(targetDirectory)) {
    // Get a list of files and subdirectories within the directory
    const directoryContents = fs.readdirSync(targetDirectory);

    // Iterate through the contents and delete each one
    for (const content of directoryContents) {
        const contentPath = join(targetDirectory, content);
        if (fs.statSync(contentPath).isDirectory()) {
            // If it's a subdirectory, delete it recursively
            fs.rmdirSync(contentPath, { recursive: true });
        } else {
            // If it's a file, delete it
            fs.unlinkSync(contentPath);
        }
    }

    // Finally, remove the directory itself
    fs.rmdirSync(targetDirectory);
} else {
    console.log(`Directory "${targetDirectory}" does not exist.`);
}

// Replace the contents of ../src/lib/static-urls-map.json with {} src/lib/static-urls-map.json
fs.writeFileSync(join(__dirname, '../src/lib/static-urls-map.json'), '{}');
