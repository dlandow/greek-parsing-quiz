/**
 * Fetches MorphGNT data from GitHub and processes it into quiz card JSON.
 *
 * MorphGNT line format (7 space-separated fields):
 *   BBCCVV  POS  PARSING  text_with_punct  word  normalized  lemma
 *
 * Parsing code (8 chars): person tense voice mood case number gender degree
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BOOKS = [
  { file: '61-Mt-morphgnt.txt', name: 'Matthew', abbr: 'Matt' },
  { file: '62-Mk-morphgnt.txt', name: 'Mark', abbr: 'Mark' },
  { file: '63-Lk-morphgnt.txt', name: 'Luke', abbr: 'Luke' },
  { file: '64-Jn-morphgnt.txt', name: 'John', abbr: 'John' },
  { file: '65-Ac-morphgnt.txt', name: 'Acts', abbr: 'Acts' },
  { file: '66-Ro-morphgnt.txt', name: 'Romans', abbr: 'Rom' },
  { file: '67-1Co-morphgnt.txt', name: '1 Corinthians', abbr: '1 Cor' },
  { file: '68-2Co-morphgnt.txt', name: '2 Corinthians', abbr: '2 Cor' },
  { file: '69-Ga-morphgnt.txt', name: 'Galatians', abbr: 'Gal' },
  { file: '70-Eph-morphgnt.txt', name: 'Ephesians', abbr: 'Eph' },
  { file: '71-Php-morphgnt.txt', name: 'Philippians', abbr: 'Phil' },
  { file: '72-Col-morphgnt.txt', name: 'Colossians', abbr: 'Col' },
  { file: '73-1Th-morphgnt.txt', name: '1 Thessalonians', abbr: '1 Thess' },
  { file: '74-2Th-morphgnt.txt', name: '2 Thessalonians', abbr: '2 Thess' },
  { file: '75-1Ti-morphgnt.txt', name: '1 Timothy', abbr: '1 Tim' },
  { file: '76-2Ti-morphgnt.txt', name: '2 Timothy', abbr: '2 Tim' },
  { file: '77-Tit-morphgnt.txt', name: 'Titus', abbr: 'Titus' },
  { file: '78-Phm-morphgnt.txt', name: 'Philemon', abbr: 'Phlm' },
  { file: '79-Heb-morphgnt.txt', name: 'Hebrews', abbr: 'Heb' },
  { file: '80-Jas-morphgnt.txt', name: 'James', abbr: 'Jas' },
  { file: '81-1Pe-morphgnt.txt', name: '1 Peter', abbr: '1 Pet' },
  { file: '82-2Pe-morphgnt.txt', name: '2 Peter', abbr: '2 Pet' },
  { file: '83-1Jn-morphgnt.txt', name: '1 John', abbr: '1 John' },
  { file: '84-2Jn-morphgnt.txt', name: '2 John', abbr: '2 John' },
  { file: '85-3Jn-morphgnt.txt', name: '3 John', abbr: '3 John' },
  { file: '86-Jud-morphgnt.txt', name: 'Jude', abbr: 'Jude' },
  { file: '87-Re-morphgnt.txt', name: 'Revelation', abbr: 'Rev' },
];

const BASE_URL = 'https://raw.githubusercontent.com/morphgnt/sblgnt/master/';

// Target noun lemmas
const TARGET_NOUNS = new Set([
  'λόγος', 'θεός', 'κόσμος', 'νόμος', 'υἱός', 'κύριος', 'ἄνθρωπος',
  'ἔργον', 'εὐαγγέλιον', 'τέκνον', 'ἱερόν', 'πνεῦμα',
  'ἀρχή', 'ζωή', 'δόξα', 'ἐκκλησία', 'γραφή', 'ἀλήθεια', 'χαρά',
  'σάρξ', 'χάρις', 'αἰών', 'πατήρ', 'σωτήρ', 'βασιλεύς',
]);

// Target verb lemmas
const TARGET_VERBS = new Set([
  'εἰμί', 'λέγω', 'ἔχω', 'εἶπον', 'γίνομαι', 'ὁράω', 'ἀκούω',
  'πιστεύω', 'ἔρχομαι', 'ποιέω', 'δίδωμι', 'ἀποκρίνομαι',
  'γράφω', 'λαμβάνω', 'ἀγαπάω', 'ζάω', 'ἐγείρω', 'βαπτίζω',
  // Common alternate lemma forms in MorphGNT
  'λέγω', 'ὁράω', 'ἔρχομαι',
]);

// Glosses for target lemmas
const GLOSSES = {
  // Nouns
  'λόγος': 'word, message',
  'θεός': 'God, god',
  'κόσμος': 'world, cosmos',
  'νόμος': 'law',
  'υἱός': 'son',
  'κύριος': 'Lord, master',
  'ἄνθρωπος': 'human being, person',
  'ἔργον': 'work, deed',
  'εὐαγγέλιον': 'gospel, good news',
  'τέκνον': 'child',
  'ἱερόν': 'temple',
  'πνεῦμα': 'spirit, wind',
  'ἀρχή': 'beginning, rule',
  'ζωή': 'life',
  'δόξα': 'glory',
  'ἐκκλησία': 'assembly, church',
  'γραφή': 'writing, scripture',
  'ἀλήθεια': 'truth',
  'χαρά': 'joy',
  'σάρξ': 'flesh',
  'χάρις': 'grace',
  'αἰών': 'age, eternity',
  'πατήρ': 'father',
  'σωτήρ': 'savior',
  'βασιλεύς': 'king',
  // Verbs
  'εἰμί': 'I am, to be',
  'λέγω': 'I say, I speak',
  'ἔχω': 'I have',
  'εἶπον': 'I said',
  'γίνομαι': 'I become, I happen',
  'ὁράω': 'I see',
  'ἀκούω': 'I hear',
  'πιστεύω': 'I believe',
  'ἔρχομαι': 'I come, I go',
  'ποιέω': 'I do, I make',
  'δίδωμι': 'I give',
  'ἀποκρίνομαι': 'I answer',
  'γράφω': 'I write',
  'λαμβάνω': 'I take, I receive',
  'ἀγαπάω': 'I love',
  'ζάω': 'I live',
  'ἐγείρω': 'I raise',
  'βαπτίζω': 'I baptize',
};

// Declension classification
const NOUN_DECLENSION = {
  'λόγος': '2nd', 'θεός': '2nd', 'κόσμος': '2nd', 'νόμος': '2nd',
  'υἱός': '2nd', 'κύριος': '2nd', 'ἄνθρωπος': '2nd',
  'ἔργον': '2nd', 'εὐαγγέλιον': '2nd', 'τέκνον': '2nd', 'ἱερόν': '2nd',
  'ἀρχή': '1st', 'ζωή': '1st', 'δόξα': '1st', 'ἐκκλησία': '1st',
  'γραφή': '1st', 'ἀλήθεια': '1st', 'χαρά': '1st',
  'πνεῦμα': '3rd', 'σάρξ': '3rd', 'χάρις': '3rd', 'αἰών': '3rd',
  'πατήρ': '3rd', 'σωτήρ': '3rd', 'βασιλεύς': '3rd',
};

// Verb conjugation family
const VERB_CONJUGATION = {
  'εἰμί': 'μι-verb (irregular)',
  'λέγω': 'ω-verb',
  'ἔχω': 'ω-verb',
  'εἶπον': 'ω-verb (suppletive aorist)',
  'γίνομαι': 'deponent',
  'ὁράω': 'contract (αω)',
  'ἀκούω': 'ω-verb',
  'πιστεύω': 'ω-verb',
  'ἔρχομαι': 'deponent',
  'ποιέω': 'contract (εω)',
  'δίδωμι': 'μι-verb',
  'ἀποκρίνομαι': 'deponent',
  'γράφω': 'ω-verb',
  'λαμβάνω': 'ω-verb',
  'ἀγαπάω': 'contract (αω)',
  'ζάω': 'contract (αω)',
  'ἐγείρω': 'ω-verb',
  'βαπτίζω': 'ω-verb',
};

const PARSING_MAP = {
  person: { '1': '1st', '2': '2nd', '3': '3rd' },
  tense: { 'P': 'Present', 'I': 'Imperfect', 'F': 'Future', 'A': 'Aorist', 'X': 'Perfect', 'Y': 'Pluperfect' },
  voice: { 'A': 'Active', 'M': 'Middle', 'P': 'Passive' },
  mood: { 'I': 'Indicative', 'D': 'Imperative', 'S': 'Subjunctive', 'O': 'Optative', 'N': 'Infinitive', 'P': 'Participle' },
  case: { 'N': 'Nominative', 'G': 'Genitive', 'D': 'Dative', 'A': 'Accusative', 'V': 'Vocative' },
  number: { 'S': 'Singular', 'P': 'Plural' },
  gender: { 'M': 'Masculine', 'F': 'Feminine', 'N': 'Neuter' },
};

function parseMorphCode(code) {
  return {
    person: PARSING_MAP.person[code[0]] || null,
    tense: PARSING_MAP.tense[code[1]] || null,
    voice: PARSING_MAP.voice[code[2]] || null,
    mood: PARSING_MAP.mood[code[3]] || null,
    case: PARSING_MAP.case[code[4]] || null,
    number: PARSING_MAP.number[code[5]] || null,
    gender: PARSING_MAP.gender[code[6]] || null,
  };
}

function parseRef(ref, bookAbbr) {
  const bb = parseInt(ref.slice(0, 2));
  const cc = parseInt(ref.slice(2, 4));
  const vv = parseInt(ref.slice(4, 6));
  return `${bookAbbr} ${cc}:${vv}`;
}

function getDifficulty(lemma, parse) {
  const decl = NOUN_DECLENSION[lemma];
  if (!decl) return 3;

  if (decl === '3rd') {
    // Irregular 3rd declension
    if (['πατήρ', 'σωτήρ', 'βασιλεύς'].includes(lemma)) return 3;
    return 2;
  }

  // 2nd declension neuter (ambiguous nom/acc)
  if (decl === '2nd' && parse.gender === 'Neuter') return 2;

  // Regular 1st and 2nd declension
  if (decl === '1st' || decl === '2nd') return 1;

  return 2;
}

async function fetchBook(book) {
  const url = `${BASE_URL}${book.file}`;
  console.log(`Fetching ${book.name}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${book.file}: ${res.status}`);
  const text = await res.text();
  return text.trim().split('\n').map(line => {
    const parts = line.split(' ');
    return {
      ref: parts[0],
      pos: parts[1],
      morph: parts[2],
      textForm: parts[3],
      word: parts[4],
      normalized: parts[5],
      lemma: parts[6],
      bookAbbr: book.abbr,
    };
  });
}

async function main() {
  console.log('Fetching MorphGNT data...');

  // Fetch all books
  const allWords = [];
  for (const book of BOOKS) {
    const words = await fetchBook(book);
    allWords.push(...words);
  }

  console.log(`Total words fetched: ${allWords.length}`);

  // Group by verse
  const verses = new Map();
  for (const w of allWords) {
    const key = `${w.bookAbbr}:${w.ref}`;
    if (!verses.has(key)) verses.set(key, []);
    verses.get(key).push(w);
  }

  // Build cards
  const nounCards = [];
  const verbCards = [];

  for (const w of allWords) {
    const isTargetNoun = w.pos === 'N-' && TARGET_NOUNS.has(w.lemma);
    const isTargetVerb = w.pos === 'V-' && TARGET_VERBS.has(w.lemma);

    if (!isTargetNoun && !isTargetVerb) continue;

    const parse = parseMorphCode(w.morph);
    const verseKey = `${w.bookAbbr}:${w.ref}`;
    const verseWords = verses.get(verseKey);
    const reference = parseRef(w.ref, w.bookAbbr);

    // Build sentence with word index
    const sentenceWords = verseWords.map(vw => vw.textForm);
    const targetIndex = verseWords.indexOf(w);

    const card = {
      id: `${w.ref}-${targetIndex}`,
      word: w.word,
      textForm: w.textForm,
      normalized: w.normalized,
      lemma: w.lemma,
      gloss: GLOSSES[w.lemma] || '',
      reference,
      sentence: sentenceWords,
      targetIndex,
      parse,
      morphCode: w.morph,
    };

    if (isTargetNoun) {
      card.type = 'noun';
      card.declension = NOUN_DECLENSION[w.lemma] || 'unknown';
      card.difficulty = getDifficulty(w.lemma, parse);

      // Check for ambiguous forms (neuter nom/acc)
      if (parse.gender === 'Neuter' && (parse.case === 'Nominative' || parse.case === 'Accusative')) {
        card.ambiguousParses = [
          { ...parse, case: 'Nominative' },
          { ...parse, case: 'Accusative' },
        ];
        card.ambiguityNote = 'Neuter nouns have identical Nominative and Accusative forms. Context determines which case is intended here.';
      }

      nounCards.push(card);
    }

    if (isTargetVerb) {
      card.type = 'verb';
      card.conjugation = VERB_CONJUGATION[w.lemma] || 'unknown';
      card.isParticiple = parse.mood === 'Participle';

      // Determine verb difficulty/grouping
      card.tenseGroup = ['Present', 'Perfect', 'Future'].includes(parse.tense) ? 'primary' : 'secondary';
      card.moodGroup = ['Infinitive', 'Participle'].includes(parse.mood) ? 'non-finite' : 'finite';

      // Middle/Passive ambiguity in certain tenses
      if (parse.voice === 'Middle' && ['Present', 'Imperfect', 'Perfect', 'Pluperfect'].includes(parse.tense)) {
        card.ambiguousParses = [
          { ...parse, voice: 'Middle' },
          { ...parse, voice: 'Passive' },
        ];
        card.ambiguityNote = 'Middle and Passive forms are identical in the Present, Imperfect, Perfect, and Pluperfect tenses. Context determines the voice.';
      }
      if (parse.voice === 'Passive' && ['Present', 'Imperfect', 'Perfect', 'Pluperfect'].includes(parse.tense)) {
        card.ambiguousParses = [
          { ...parse, voice: 'Middle' },
          { ...parse, voice: 'Passive' },
        ];
        card.ambiguityNote = 'Middle and Passive forms are identical in the Present, Imperfect, Perfect, and Pluperfect tenses. Context determines the voice.';
      }

      verbCards.push(card);
    }
  }

  console.log(`Noun cards: ${nounCards.length}`);
  console.log(`Verb cards: ${verbCards.length}`);

  // Deduplicate: keep max ~8 cards per lemma+form combination to avoid overloading common forms
  function dedup(cards) {
    const groups = new Map();
    for (const card of cards) {
      const key = `${card.lemma}-${card.morphCode}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(card);
    }

    const result = [];
    for (const [key, group] of groups) {
      // Shuffle and take up to 8
      const shuffled = group.sort(() => Math.random() - 0.5);
      result.push(...shuffled.slice(0, 8));
    }
    return result;
  }

  const dedupedNouns = dedup(nounCards);
  const dedupedVerbs = dedup(verbCards);

  console.log(`After dedup - Noun cards: ${dedupedNouns.length}, Verb cards: ${dedupedVerbs.length}`);

  // Print form coverage
  const nounForms = new Set(dedupedNouns.map(c => `${c.lemma} ${c.parse.case} ${c.parse.number} ${c.parse.gender}`));
  const verbForms = new Set(dedupedVerbs.map(c => `${c.lemma} ${c.parse.person || ''} ${c.parse.tense} ${c.parse.voice} ${c.parse.mood}`));
  console.log(`Unique noun forms: ${nounForms.size}`);
  console.log(`Unique verb forms: ${verbForms.size}`);

  const output = {
    nouns: dedupedNouns,
    verbs: dedupedVerbs,
    meta: {
      source: 'MorphGNT/SBLGNT',
      generated: new Date().toISOString(),
      nounCount: dedupedNouns.length,
      verbCount: dedupedVerbs.length,
      uniqueNounForms: nounForms.size,
      uniqueVerbForms: verbForms.size,
    }
  };

  const outPath = resolve(__dirname, '..', 'src', 'data', 'cards.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Written to ${outPath}`);
}

main().catch(console.error);
