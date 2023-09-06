// This script preloads files from the aquifer server to the static folder of the sveletekit project.
// This script is meant to be run from the command line. using the following command:

// node scripts/preload-files-to-static.js language=eng bible=BSB book=mark audio=true resources=true

// The above command will preload the english bible, BSB, book of mark, with audio and resources.
// Since this is a POC, the script only accepts one language, one bible, and one book and gives you the option to preload audio and resources.
// The script should be run and then yarn build will build the static folder with the preloaded files.
// If you want mutiple books or bibles, rerun the script with the new book and or bible.

import fs from 'fs';
import { join, basename, dirname } from 'path';
import 'dotenv/config';

// setup for url matching
const urls = [];

// get the user input
const args = process.argv.slice(2);
const userArgs = {};
args.forEach(function (val) {
    var split = val.split('=');
    userArgs[split[0]] = split[1];
});

const apiUrl = process.env.PUBLIC_AQUIFER_API_URL;
const cdnUrl = 'https://cdn.aquifer.bible/';

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
    const pathName = dirname(str);
    return { fileName: basename(str), pathName: pathName.startsWith('/') ? pathName.slice(1) : pathName };
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

function formatStaticPath(str, pattern) {
    return '/' + staticCdnPath + str.replace(pattern, '');
}

const staticCdnPath = 'static/cached-data/cdn/';
const staticApiPath = 'static/cached-data/api/';
const languagesPath = 'languages/';
const languagesUrl = `${apiUrl}languages`;

const languages = await getData(languagesUrl);

//make directory for language
fs.mkdirSync(`${staticApiPath}${languagesPath}`, { recursive: true });

//write language file as index.json in language directory
fs.writeFileSync(`${staticApiPath}${languagesPath}index.json`, JSON.stringify(languages));

// find language id
const language = languages.find((lang) => lang.iso6393Code.toLowerCase() === userArgs.language.toLowerCase());

// get bible data with language id
const biblesPath = `bibles/language/${language.id}/`;
const biblesUrl = `${apiUrl}bibles/language/${language.id}`;
const bibleData = await getData(biblesUrl);

// make directory for bibleData
fs.mkdirSync(`${staticApiPath}${biblesPath}`, { recursive: true });

// write bibleData as index.json in bible directory
fs.writeFileSync(`${staticApiPath}${biblesPath}index.json`, JSON.stringify(bibleData));

const passagesPath = `passages/resources/language/${language.id}/`;
const passagesUrl = `${apiUrl}passages/resources/language/${language.id}`;
const passagesData = await getData(passagesUrl);

// make directory for passagesData
fs.mkdirSync(`${staticApiPath}${passagesPath}`, { recursive: true });

// write passagesData as index.json in passages directory
fs.writeFileSync(`${staticApiPath}${passagesPath}index.json`, JSON.stringify(passagesData));

// using bibleData, passagesData and user input, create a list of urls to fetch
// user input: language=eng bible=BSB book=mark audio=true resouces=true

// get bible
const bible = bibleData.find((bible) => bible.name.toLowerCase().includes(userArgs.bible.toLowerCase()));

// get book
const book = bible.contents.find((book) => book.displayName.toLowerCase().includes(userArgs.book.toLowerCase()));

// start loading up urls
urls.push({
    apiUrl: book.textUrl,
    staticPath: formatStaticPath(book.textUrl, cdnUrl),
});

if (userArgs.audio === 'true') {
    book.audioUrls.chapters.forEach((chapter) => {
        urls.push({
            apiUrl: chapter.webm.url,
            staticPath: formatStaticPath(chapter.webm.url, cdnUrl),
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
                        staticPath: formatStaticPath(resource.content.content.url, cdnUrl),
                    });
                } else if (resource.mediaType === 2 && userArgs.audio === 'true') {
                    resource.content.content.steps.forEach((step) => {
                        urls.push({
                            apiUrl: step.webm.url,
                            staticPath: formatStaticPath(step.webm.url, cdnUrl),
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
    await downloadResource(fileName, `${pathName}`, url.apiUrl);
});

// Manually adding more urls after downloading the first set.
// This is because the first set of urls are needed to get the rest of the urls.

// adding language index.json
urls.push({
    apiUrl: languagesUrl,
    staticPath: `/${staticApiPath}${languagesPath}index.json`,
});

// adding bible index.json
urls.push({
    apiUrl: biblesUrl,
    staticPath: `/${staticApiPath}${biblesPath}index.json`,
});

// adding passages index.json
urls.push({
    apiUrl: passagesUrl,
    staticPath: `/${staticApiPath}${passagesPath}index.json`,
});

// finally adding the urls to the src folder as static-urls-map.json
const staticUrlsMap = {};

// read ./src/lib/static-urls-map.json and get the existing urls
const existingUrlsMap = JSON.parse(fs.readFileSync('./src/lib/static-urls-map.json', 'utf8'));

// add the existing urls to the staticUrlsMap
Object.keys(existingUrlsMap).forEach((key) => {
    staticUrlsMap[key] = existingUrlsMap[key];
});

// add the new urls to the staticUrlsMap
urls.forEach((url) => {
    staticUrlsMap[url.apiUrl] = url.staticPath.replace(/^\/static/, '');
});

// write the staticUrlsMap to the static-urls-map.json file
fs.writeFileSync(`./src/lib/static-urls-map.json`, JSON.stringify(staticUrlsMap));
