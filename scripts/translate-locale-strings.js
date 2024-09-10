// This script translates locale strings from English into other languages.
// Examples:
//    Translate single string: `node scripts/translate-locale-strings.js "page.menu.home" spa`
//    Translate multiple strings: `node scripts/translate-locale-strings.js "page.menu.*" spa`

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import childProcess from 'child_process';
import micromatch from 'micromatch';
import readlineImport from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localeFile = path.join(__dirname, '../src/lib/i18n/locales/eng.json');
const localeData = JSON.parse(fs.readFileSync(localeFile, 'utf8'));

function getValueByPath(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function findMatchingKeys(obj, pattern, prefix = '') {
    let matches = [];
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && !('value' in obj[key])) {
            matches = matches.concat(findMatchingKeys(obj[key], pattern, fullKey));
        } else if (micromatch.isMatch(fullKey, pattern)) {
            matches.push(fullKey);
        }
    }
    return matches;
}

const pattern = process.argv[2];
const languageCode = process.argv[3];

const languageCodesToNames = {
    tpi: 'Tok Pisin',
    spa: 'Spanish',
    fra: 'French',
    arb: 'Arabic',
    hin: 'Hindi',
    swh: 'Swahili',
    rus: 'Russian',
};

if (!languageCodesToNames[languageCode]) {
    console.error(`Invalid language code: ${languageCode}`);
    process.exit(1);
}

const matchingKeys = findMatchingKeys(localeData, pattern);

console.log('Copy paste the following into ChatGPT:');
console.log('');

console.log(
    `Translate the values into ${languageCodesToNames[languageCode]}. Leave the dot notation key and colon. Do not include "_context" translations in the response. Those are there to help you as the translator.`
);
console.log('```');
matchingKeys.forEach((key) => {
    const value = getValueByPath(localeData, key);
    console.log(`${key}.value: ${value.value}`);
    console.log(`${key}._context: ${value._context}`);
});
console.log('```');

console.log('');
console.log('Hit Enter to open your editor and paste ChatGPT result. Then close the editor.');

const readline = readlineImport.createInterface({
    input: process.stdin,
    output: process.stdout,
});

readline.question('', () => {
    readline.close();

    const tempFile = path.join(__dirname, `../src/lib/i18n/locales/${languageCode}_temp.json`);
    fs.writeFileSync(tempFile, '');

    const editor = process.env.EDITOR || 'code';
    const child = childProcess.spawn(editor, [tempFile], {
        stdio: 'inherit',
    });

    child.on('exit', function (_, __) {
        const input = fs.readFileSync(tempFile, 'utf8');
        fs.unlinkSync(tempFile);

        const translations = input.split('\n');
        const outputFile = path.join(__dirname, `../src/lib/i18n/locales/${languageCode}.json`);
        let updatedLocaleData = {};

        try {
            updatedLocaleData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Error reading existing file: ${error}`);
                process.exit(1);
            }
        }

        for (let i = 0; i < translations.length; i++) {
            if (translations[i].trim() !== '') {
                const key = translations[i].split(':', 2)[0].trim();
                const value = translations[i].split(':', 2)[1].trim();

                const parts = key.split('.');
                let current = updatedLocaleData;

                for (let j = 0; j < parts.length - 1; j++) {
                    if (!current[parts[j]]) {
                        current[parts[j]] = {};
                    }
                    current = current[parts[j]];
                }

                current[parts[parts.length - 1]] = value;
            }
        }

        fs.writeFileSync(outputFile, JSON.stringify(updatedLocaleData, null, 4));
        console.log(`Updated locale file: ${outputFile}`);
    });
});
