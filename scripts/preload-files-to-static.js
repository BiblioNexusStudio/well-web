// This script preloads files from the aquifer server to the static folder of the sveletekit project.
// This script is meant to be run from the command line. using the following command:
// node scripts/preload-files-to-static.js language=eng bible=BSB book=mark audio=true resouces=true
// The above command will preload the english bible, BSB, book of mark, with audio and resources.
// Since this is a POC, the script only accepts one language, one bible, and one book and gives you the option to preload audio and resources.
// The script should be run and then yarn build will build the static folder with the preloaded files.

import fs from 'fs';
import { join } from 'path';

// setup for url matching
const urls = [];

// get the user input
const args = process.argv.slice(2);
const userArgs = {};
args.forEach(function (val) {
    var split = val.split('=');
    userArgs[split[0]] = split[1];
});

const apiUrl = 'https://aquifer-server-dev.azurewebsites.net/';
const cndUrl = 'https://cdn.aquifer.bible/';

async function downloadResource(filename, directory, url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filepath = join(directory, filename);
        await fs.promises.mkdir(directory, { recursive: true });
        await fs.promises.writeFile(filepath, buffer);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

function getFileNameAndPath(str) {
    const split = str.split('/');
    const fileName = split.pop();
    const pathName = split.join('/');
    return { fileName, pathName };
}

async function getData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

function removeBeginningPattern(str, pattern) {
    return str.replace(pattern, '');
}

const staticPath = './static/';
const languagesPath = 'languages/';
const languagesUrl = `${apiUrl}languages/`;

const languages = await getData(languagesUrl);

//make directory for language
fs.mkdirSync(`${staticPath}${languagesPath}`, { recursive: true });

//write language file as index.json in language directory
fs.writeFileSync(`${staticPath}${languagesPath}index.json`, JSON.stringify(languages));

// find language id
const language = languages.find((lang) => lang.iso6393Code.toLowerCase() === userArgs.language.toLowerCase());

// get bible data with language id
const biblesPath = `bibles/language/${language.id}`;
const biblesUrl = `${apiUrl}bibles/language/${language.id}`;
const bibleData = await getData(biblesUrl);

// make directory for bibleData
fs.mkdirSync(`${staticPath}${biblesPath}`, { recursive: true });

// write bibleData as index.json in bible directory
fs.writeFileSync(`${staticPath}${biblesPath}/index.json`, JSON.stringify(bibleData));

const passagesPath = `passages/resources/language/${language.id}`;
const passagesUrl = `${apiUrl}/passages/resources/language/${language.id}`;
const passagesData = await getData(passagesUrl);

// make directory for passagesData
fs.mkdirSync(`${staticPath}${passagesPath}`, { recursive: true });

// write passagesData as index.json in passages directory
fs.writeFileSync(`${staticPath}${passagesPath}/index.json`, JSON.stringify(passagesData));

// using bibleData, passagesData and user input, create a list of urls to fetch
// user input: language=eng bible=BSB book=mark audio=true resouces=true

// get bible
const bible = bibleData.find((bible) => bible.name.toLowerCase().includes(userArgs.bible.toLowerCase()));

// get book
const book = bible.contents.find((book) => book.displayName.toLowerCase().includes(userArgs.book.toLowerCase()));

// create textUrl static path
const staticTextPath = `${staticPath}${bible.id}/${book.id}/text/`;

// start loading up urls
urls.push({
    apiUrl: book.textUrl,
    staticPath: removeBeginningPattern(book.textUrl, cndUrl),
});

if (userArgs.audio === 'true') {
    book.audioUrls.chapters.forEach((chapter) => {
        urls.push({
            apiUrl: chapter.webm.url,
            staticPath: removeBeginningPattern(chapter.webm.url, cndUrl),
        });
    });
}

if (userArgs.resources === 'true') {
    passagesData.forEach((passage) => {
        if (passage.bookName.toLowerCase().includes(userArgs.book.toLowerCase())) {
            passage.resources.forEach((resource) => {
                if (resource.mediaType === 1) {
                    urls.push({
                        apiUrl: resource.content.content.url,
                        staticPath: removeBeginningPattern(resource.content.content.url, cndUrl),
                    });
                } else if (resource.mediaType === 2 && userArgs.audio === 'true') {
                    resource.content.content.steps.forEach((step) => {
                        urls.push({
                            apiUrl: step.webm.url,
                            staticPath: removeBeginningPattern(step.webm.url, cndUrl),
                        });
                    });
                }
            });
        }
    });
}

// download urls
urls.forEach(async (url) => {
    const { fileName, pathName } = getFileNameAndPath(url.staticPath);
    await downloadResource(fileName, `${staticPath}${pathName}`, url.apiUrl);
});

// Manually adding more urls after downloading the first set.
// This is because the first set of urls are needed to get the rest of the urls.

// adding language index.json
urls.push({
    apiUrl: languagesUrl,
    staticPath: `${languagesPath}index.json`,
});

// adding bible index.json
urls.push({
    apiUrl: biblesUrl,
    staticPath: `${biblesPath}/index.json`,
});

// adding passages index.json
urls.push({
    apiUrl: passagesUrl,
    staticPath: `${passagesPath}/index.json`,
});

// finally adding the urls to the staticPath
// make directory for passagesData
fs.mkdirSync(`${staticPath}staticUrlsMap`, { recursive: true });

// write passagesData as index.json in passages directory
fs.writeFileSync(`${staticPath}staticUrlsMap/index.json`, JSON.stringify(urls));
