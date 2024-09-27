// This script translates locale strings from English into other languages.
// Examples:
//    Translate single string: `node scripts/translate-locale-strings.js "page.menu.home" spa`
//    Translate multiple strings: `node scripts/translate-locale-strings.js "page.menu.*" spa`
//    Translate single string into multiple langs: `node scripts/translate-locale-strings.js "page.menu.home" all`

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import micromatch from 'micromatch';
import readlineImport from 'readline';
import clipboardy from 'clipboardy';

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
    por: 'Brazilian Portuguese',
    ind: 'Indonesian',
    zhs: 'Simplified Chinese',
    all: 'All Languages',
};

if (!languageCodesToNames[languageCode]) {
    console.error(`Invalid language code: ${languageCode}`);
    process.exit(1);
}

const matchingKeys = findMatchingKeys(localeData, pattern);

const batchSize = 30;

for (let i = 0; i < matchingKeys.length; i += batchSize) {
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(matchingKeys.length / batchSize)}`);

    let forChatGpt = '';

    if (languageCode === 'all') {
        forChatGpt += `Translate the values into these languages (${Object.values(languageCodesToNames)
            .filter((lang) => lang !== 'All Languages')
            .join(
                ', '
            )}). Leave the dot notation key and colon on each line and prefix each line with the language in parentheses. Do not include "_context" in the response. That is only there to help you as the translator. Return response in a code block. Please do not include "_context".\n\n`;
    } else {
        forChatGpt += `Translate the values into ${languageCodesToNames[languageCode]}. Leave the dot notation key and colon on each line. Do not include "_context" in the response. That is only there to help you as the translator. Return response in a code block. Please do not include "_context".\n\n`;
    }
    const batch = matchingKeys.slice(i, i + batchSize);

    let batchText = '```\n';
    batch.forEach((key) => {
        const value = getValueByPath(localeData, key);
        batchText += `${key}.value: ${value.value}\n`;
        batchText += `${key}._context: ${value._context}\n`;
    });
    batchText += '```\n';

    forChatGpt += batchText;
    clipboardy.writeSync(forChatGpt);

    console.log('');
    console.log('Some text has been copied to your clipboard. Paste the text to ChatGPT.');
    console.log('');
    console.log("Copy ChatGPT's response to your clipboard and hit Enter.");

    await waitForEnter();

    handleTranslationsOnClipboard();
}

function handleTranslationsOnClipboard() {
    const input = clipboardy.readSync();

    const translations = input.split('\n');

    if (languageCode === 'all') {
        const languageOutputs = {};
        Object.keys(languageCodesToNames).forEach((code) => {
            if (code !== 'all') {
                languageOutputs[code] = {};
            }
        });

        translations.forEach((translation) => {
            if (translation.trim() !== '') {
                const validLineMatch = translation.match(/^\(([^)]+)\)\s[A-Za-z0-9.]+:\s(.*)$/);
                if (!validLineMatch || !Object.values(languageCodesToNames).includes(validLineMatch[1])) {
                    console.error(`Invalid line or language from ChatGPT: ${translation}`);
                    console.error('Expected format like: `(Swahili) page.bible: Biblia`');
                    process.exit(1);
                }

                const match = translation.match(/^\(([^)]+)\)\s(.+)$/);
                if (match) {
                    const lang = match[1];
                    const restOfLine = match[2];
                    const [key, value] = restOfLine.split(':', 2).map((s) => s.trim());
                    const langCode = Object.keys(languageCodesToNames).find((code) =>
                        languageCodesToNames[code].toLowerCase().startsWith(lang.toLowerCase())
                    );
                    if (langCode) {
                        updateNestedObject(languageOutputs[langCode], key, value);
                    }
                }
            }
        });

        Object.entries(languageOutputs).forEach(([code, data]) => {
            const outputFile = path.join(__dirname, `../src/lib/i18n/locales/${code}.json`);
            let updatedLocaleData = {};
            try {
                updatedLocaleData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error(`Error reading existing file: ${error}`);
                    return;
                }
            }
            deepMerge(updatedLocaleData, data);
            fs.writeFileSync(outputFile, JSON.stringify(updatedLocaleData, null, 4) + '\n');
            console.log(`Updated locale file: ${outputFile}`);
        });
    } else {
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

        translations.forEach((translation) => {
            if (translation.trim() !== '') {
                const [key, value] = translation.split(':', 2).map((s) => s.trim());
                updateNestedObject(updatedLocaleData, key, value);
            }
        });

        fs.writeFileSync(outputFile, JSON.stringify(updatedLocaleData, null, 4) + '\n');
        console.log(`Updated locale file: ${outputFile}`);
    }
}

function deepMerge(target, source) {
    for (const key in source) {
        if (key in source) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return target;
}

function updateNestedObject(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

async function waitForEnter() {
    const readline = readlineImport.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        readline.question('', () => {
            readline.close();
            resolve();
        });
    });
}
