import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const source = join(__dirname, '..', 'static', 'js', 'caching-config.js');
const target = join(__dirname, '..', 'src', 'lib', 'caching-config.js');

if (os.platform().startsWith('win')) {
    try {
        fs.copyFileSync(source, target);
        console.log('File copied successfully');
    } catch (err) {
        console.error('Error copying file:', err);
    }
} else {
    try {
        fs.unlinkSync(target);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Error removing existing symlink:', err);
        }
    }

    try {
        fs.symlinkSync(source, target, 'file');
        console.log('Symlink created successfully');
    } catch (err) {
        console.error('Error creating symlink:', err);
    }
}
