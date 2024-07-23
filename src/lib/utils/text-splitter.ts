export interface WordOrPunctuation {
    text: string;
    spaceFollowing: boolean;
    isPunctuation: boolean;
}

const punctuationChars = ["'", '!', '"', '(', ')', ',', '.', ':', ';', '?', '“', '”', '’', '‘', '—'];

export function splitTextIntoWordsAndPunctuation(text: string) {
    const result: WordOrPunctuation[] = [];
    const words = text.match(/\S+|\s+/g) || [];

    words.forEach((word, index) => {
        if (word.trim() === '') {
            return;
        }

        let currentWord = '';
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (char === '.' && word.slice(i, i + 3) === '...') {
                if (currentWord) {
                    result.push({
                        text: currentWord,
                        spaceFollowing: false,
                        isPunctuation: false,
                    });
                    currentWord = '';
                }
                result.push({
                    text: '...',
                    spaceFollowing: false,
                    isPunctuation: true,
                });
                i += 2;
            } else if (
                (char === "'" || char === '’' || char === '‘') &&
                ((i > 0 &&
                    i < word.length - 1 &&
                    word?.[i - 1]?.match(/[a-zA-Z]/) &&
                    word?.[i + 1]?.match(/[a-zA-Z]/)) ||
                    (i === word.length - 1 && i > 0 && word?.[i - 1]?.match(/[a-zA-Z]/)))
            ) {
                // This is likely a possessive apostrophe (including cases like "Thomas'"), so keep it with the word
                currentWord += char;
            } else if (char && punctuationChars.includes(char)) {
                if (currentWord) {
                    result.push({
                        text: currentWord,
                        spaceFollowing: false,
                        isPunctuation: false,
                    });
                    currentWord = '';
                }
                result.push({
                    text: char,
                    spaceFollowing: false,
                    isPunctuation: true,
                });
            } else {
                currentWord += char;
            }
        }

        if (currentWord) {
            result.push({
                text: currentWord,
                spaceFollowing: false,
                isPunctuation: false,
            });
        }

        if (index < words.length - 1 && words[index + 1]?.trim() === '') {
            const wordWithSpace = result[result.length - 1];
            if (wordWithSpace) {
                wordWithSpace.spaceFollowing = true;
            }
        }
    });

    return result;
}
