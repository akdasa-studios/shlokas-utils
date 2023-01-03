const cheerio = require('cheerio');
const fs = require('fs');
const getUuid = require('uuid-by-string')

async function parse(idx) {
    const data = await fetch(`https://vedabase.io/ru/library/bg/1/${idx}/`)
    const response = await data.text()
    const $ = cheerio.load(response)

    const verseNumber = $(".r-title").text().trim()
    const verseText = $(".r-verse-text").html()
    const verseTranslation = $(".r-translation").text()
    const verseSynonyms = $(".r-synonyms > p").contents()

    const number = cleanupNumber(verseNumber)
    const text = cleanupText(verseText)

    const synonyms = []
    const currentSynonym = {
        words: [],
        translation: ""
    }

    for (node of verseSynonyms) {
        const word = $(node).text()
        if (!word.trim()) { continue }
        if (word.trim() === '-') { continue }

        if (node.name === 'a') {
            currentSynonym.words.push(word)
        } else {
            currentSynonym.translation += cleanupTranslation(word)

            if (word.includes(";")) {
                synonyms.push(Object.assign({}, currentSynonym))
                currentSynonym.words = []
                currentSynonym.translation = ""
            }
        }
    }

    return {
        uuid: getUuid(number, 3),
        number,
        text,
        synonyms,
        translation: verseTranslation
    }
}

function cleanupTranslation(text) {
    return text.replaceAll('—', '').replaceAll(';', '').trim()
}

function cleanupText(text) {
    return text.replaceAll('<em>','').replaceAll('</em>', '').split("<br>")
}

function cleanupNumber(text) {
    return text.replaceAll('. ', ' ').toUpperCase()
}

async function main() {
    const result = []
    for (var i=1; i<=46; i++) {
        try {
            const parseResult = await parse(i)
            result.push(parseResult)
        } catch (e) {
            console.log("failed")
        }
    }
    await fs.writeFile("out.json", JSON.stringify(result), () => {console.log("done")})
}

main()