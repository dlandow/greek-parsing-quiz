/**
 * Morpheme analysis: split Greek words into stem + ending
 * for visual color-coding in the quiz.
 */

// Known endings by declension and parse
const NOUN_ENDINGS_2ND_MASC = {
  'Nominative:Singular': 'ος',
  'Genitive:Singular': 'ου',
  'Dative:Singular': 'ῳ',  // with iota subscript
  'Accusative:Singular': 'ον',
  'Nominative:Plural': 'οι',
  'Genitive:Plural': 'ων',
  'Dative:Plural': 'οις',
  'Accusative:Plural': 'ους',
};

const NOUN_ENDINGS_2ND_NEUT = {
  'Nominative:Singular': 'ον',
  'Genitive:Singular': 'ου',
  'Dative:Singular': 'ῳ',
  'Accusative:Singular': 'ον',
  'Nominative:Plural': 'α',
  'Genitive:Plural': 'ων',
  'Dative:Plural': 'οις',
  'Accusative:Plural': 'α',
};

const NOUN_ENDINGS_1ST_ETA = {
  'Nominative:Singular': 'η',
  'Genitive:Singular': 'ης',
  'Dative:Singular': 'ῃ',
  'Accusative:Singular': 'ην',
  'Nominative:Plural': 'αι',
  'Genitive:Plural': 'ων',  // note: ῶν with circumflex
  'Dative:Plural': 'αις',
  'Accusative:Plural': 'ας',
};

const NOUN_ENDINGS_1ST_ALPHA = {
  'Nominative:Singular': 'α',
  'Genitive:Singular': 'ας',
  'Dative:Singular': 'ᾳ',
  'Accusative:Singular': 'αν',
  'Nominative:Plural': 'αι',
  'Genitive:Plural': 'ων',
  'Dative:Plural': 'αις',
  'Accusative:Plural': 'ας',
};

/**
 * Try to split a Greek word into stem and ending.
 * Returns { stem, ending } or null if we can't determine.
 */
export function splitMorpheme(word, card) {
  if (!word || !card?.parse) return null;

  const cleanWord = word.replace(/[.,;·⸂⸃⸀⸁\[\]()]/g, '');

  if (card.type === 'noun') {
    return splitNounMorpheme(cleanWord, card);
  }
  if (card.type === 'verb') {
    return splitVerbMorpheme(cleanWord, card);
  }
  return null;
}

function splitNounMorpheme(word, card) {
  const { parse, declension, lemma } = card;
  const key = `${parse.case}:${parse.number}`;

  let endingMap;
  if (declension === '2nd') {
    endingMap = parse.gender === 'Neuter' ? NOUN_ENDINGS_2ND_NEUT : NOUN_ENDINGS_2ND_MASC;
  } else if (declension === '1st') {
    // Check if eta or alpha type
    if (lemma.endsWith('η') || lemma.endsWith('ή')) {
      endingMap = NOUN_ENDINGS_1ST_ETA;
    } else {
      endingMap = NOUN_ENDINGS_1ST_ALPHA;
    }
  }

  if (endingMap && endingMap[key]) {
    const ending = endingMap[key];
    // Try to match the ending at the end of the word (ignoring accents for matching)
    const stripped = stripAccents(word);
    const strippedEnding = stripAccents(ending);

    if (stripped.endsWith(strippedEnding)) {
      const stemLen = word.length - ending.length;
      if (stemLen > 0) {
        return {
          stem: word.slice(0, stemLen),
          ending: word.slice(stemLen),
        };
      }
    }
  }

  // Fallback: try to split at a reasonable point
  // For 3rd declension and others, use a simple heuristic
  if (word.length > 3) {
    // Try common 3rd declension endings
    const thirdDeclEndings = ['ματος', 'ματι', 'ματα', 'ματων', 'μασιν', 'μασι',
                               'τος', 'τι', 'τα', 'των', 'σιν', 'σι',
                               'ος', 'ι', 'α', 'ων', 'ας', 'ες', 'εως', 'ει', 'εα',
                               'ερος', 'ερι', 'ερα', 'ερων', 'ερες',
                               'εως', 'εων', 'ευσιν', 'ευσι', 'εις'];

    const stripped = stripAccents(word);
    for (const end of thirdDeclEndings) {
      if (stripped.endsWith(stripAccents(end)) && stripped.length > end.length) {
        const stemLen = word.length - end.length;
        return {
          stem: word.slice(0, stemLen),
          ending: word.slice(stemLen),
        };
      }
    }
  }

  return null;
}

function splitVerbMorpheme(word, card) {
  const { parse } = card;

  // For verbs, try to identify the personal ending
  const cleanWord = word;

  if (cleanWord.length < 3) return null;

  // Check for augment (ε- prefix for past tenses)
  let hasAugment = false;
  let augment = '';
  if (['Imperfect', 'Aorist', 'Pluperfect'].includes(parse.tense)) {
    const stripped = stripAccents(cleanWord);
    if (stripped.startsWith('ε') || stripped.startsWith('η')) {
      // Could be augmented — but many words start with ε naturally
      // Only mark augment if the lemma doesn't start with the same letter
      const lemmaStripped = stripAccents(card.lemma);
      if (!lemmaStripped.startsWith(stripped[0])) {
        hasAugment = true;
        augment = cleanWord[0];
      }
    }
  }

  // Try to find the ending
  const verbEndings = [
    // Present active
    'ομεν', 'ετε', 'ουσιν', 'ουσι',
    'εις', 'ει', 'ω',
    // Present mid/pass
    'ομεθα', 'εσθε', 'ονται',
    'ομαι', 'εται', 'ῃ',
    // Aorist active
    'σαμεν', 'σατε', 'σαν',
    'σας', 'σεν', 'σε', 'σα',
    // Aorist middle
    'σαμην', 'σατο', 'σαμεθα', 'σασθε', 'σαντο', 'σω',
    // Perfect
    'καμεν', 'κατε', 'κασιν', 'κασι',
    'κας', 'κεν', 'κε', 'κα',
    // Imperfect
    'ομεν', 'ετε', 'ον',
    'ες', 'εν', 'ε',
    // Generic
    'μεν', 'τε', 'σιν', 'σι', 'ν',
  ];

  const stripped = stripAccents(cleanWord);
  for (const end of verbEndings) {
    if (stripped.endsWith(stripAccents(end)) && stripped.length > end.length + 1) {
      const stemLen = cleanWord.length - end.length;

      if (hasAugment) {
        return {
          augment: cleanWord[0],
          stem: cleanWord.slice(1, stemLen),
          ending: cleanWord.slice(stemLen),
        };
      }
      return {
        stem: cleanWord.slice(0, stemLen),
        ending: cleanWord.slice(stemLen),
      };
    }
  }

  return null;
}

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
}
