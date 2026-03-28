/**
 * Fetches ESV English translations for all verses used in cards.json.
 * Saves progress every 200 verses so partial runs aren't lost.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cardsPath = resolve(__dirname, '..', 'src', 'data', 'cards.json');
const cachePath = resolve(__dirname, 'translation-cache.json');

const ESV_API_KEY = process.env.ESV_API_KEY || 'YOUR_ESV_API_KEY_HERE';
const ESV_BASE = 'https://api.esv.org/v3/passage/text/';

const BOOK_MAP = {
  'Matt': 'Matthew', 'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John',
  'Acts': 'Acts', 'Rom': 'Romans', '1 Cor': '1 Corinthians', '2 Cor': '2 Corinthians',
  'Gal': 'Galatians', 'Eph': 'Ephesians', 'Phil': 'Philippians', 'Col': 'Colossians',
  '1 Thess': '1 Thessalonians', '2 Thess': '2 Thessalonians', '1 Tim': '1 Timothy',
  '2 Tim': '2 Timothy', 'Titus': 'Titus', 'Phlm': 'Philemon', 'Heb': 'Hebrews',
  'Jas': 'James', '1 Pet': '1 Peter', '2 Pet': '2 Peter', '1 John': '1 John',
  '2 John': '2 John', '3 John': '3 John', 'Jude': 'Jude', 'Rev': 'Revelation',
};

function parseRef(ref) {
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  return { book: match[1], chapter: parseInt(match[2]), verse: parseInt(match[3]) };
}

function toEsvRef(ref) {
  const parsed = parseRef(ref);
  if (!parsed) return null;
  const bookName = BOOK_MAP[parsed.book];
  if (!bookName) return null;
  return `${bookName} ${parsed.chapter}:${parsed.verse}`;
}

// Load cache of already-fetched translations
function loadCache() {
  try { return JSON.parse(readFileSync(cachePath, 'utf-8')); } catch { return {}; }
}
function saveCache(cache) {
  writeFileSync(cachePath, JSON.stringify(cache));
}

async function fetchSingleVerse(ref, retries = 2) {
  const esvRef = toEsvRef(ref);
  if (!esvRef) return null;

  const params = new URLSearchParams({
    q: esvRef,
    'include-passage-references': 'false',
    'include-verse-numbers': 'false',
    'include-footnotes': 'false',
    'include-headings': 'false',
    'include-short-copyright': 'false',
    'include-passage-horizontal-lines': 'false',
    'include-heading-horizontal-lines': 'false',
    'indent-paragraphs': '0',
    'indent-poetry': 'false',
  });

  try {
    const res = await fetch(`${ESV_BASE}?${params}`, {
      headers: { 'Authorization': `Token ${ESV_API_KEY}` },
    });

    if (res.status === 429 && retries > 0) {
      await new Promise(r => setTimeout(r, 3000));
      return fetchSingleVerse(ref, retries - 1);
    }
    if (!res.ok) return null;

    const data = await res.json();
    if (data.passages && data.passages[0]) {
      return data.passages[0].replace(/\n+/g, ' ').trim();
    }
    return null;
  } catch {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return fetchSingleVerse(ref, retries - 1);
    }
    return null;
  }
}

async function main() {
  const cards = JSON.parse(readFileSync(cardsPath, 'utf-8'));
  const allCards = [...cards.nouns, ...cards.verbs];
  const uniqueRefs = [...new Set(allCards.map(c => c.reference))];

  const cache = loadCache();
  const needed = uniqueRefs.filter(ref => !cache[ref]);

  console.log(`Total unique verses: ${uniqueRefs.length}`);
  console.log(`Already cached: ${uniqueRefs.length - needed.length}`);
  console.log(`Need to fetch: ${needed.length}`);

  let fetched = 0;
  let failed = 0;

  for (const ref of needed) {
    const text = await fetchSingleVerse(ref);
    fetched++;

    if (text) {
      cache[ref] = text;
    } else {
      failed++;
    }

    // Save cache every 200 verses
    if (fetched % 200 === 0) {
      saveCache(cache);
      console.log(`Progress: ${fetched}/${needed.length} (${failed} failed) — saved cache`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  // Final cache save
  saveCache(cache);
  console.log(`\nDone fetching. ${Object.keys(cache).length} total cached, ${failed} failed this run.`);

  // Apply translations to cards
  let applied = 0;
  for (const card of [...cards.nouns, ...cards.verbs]) {
    if (cache[card.reference]) {
      card.translation = cache[card.reference];
      applied++;
    }
  }

  console.log(`Applied translations to ${applied}/${allCards.length} cards`);
  writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
  console.log('Saved cards.json');
}

main().catch(console.error);
