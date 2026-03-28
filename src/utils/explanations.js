/**
 * Generate grammatical explanations for parsed forms.
 */

const CASE_EXPLANATIONS = {
  Nominative: 'subject of the sentence or predicate nominative',
  Genitive: 'possession, source, separation, or description (often translated "of...")',
  Dative: 'indirect object, means, location, or reference (often translated "to/for/by...")',
  Accusative: 'direct object, extent, or destination',
  Vocative: 'direct address',
};

const TENSE_EXPLANATIONS = {
  Present: 'ongoing or repeated action (imperfective aspect)',
  Imperfect: 'past ongoing or repeated action (past imperfective)',
  Aorist: 'simple or undefined action (perfective aspect), often past tense in the indicative',
  Perfect: 'completed action with continuing results (stative aspect)',
  Pluperfect: 'past state resulting from prior completed action',
  Future: 'future action or intention',
};

const VOICE_EXPLANATIONS = {
  Active: 'the subject performs the action',
  Middle: 'the subject acts on itself or in its own interest',
  Passive: 'the subject receives the action',
};

const MOOD_EXPLANATIONS = {
  Indicative: 'states something as a fact or asks a factual question',
  Subjunctive: 'expresses possibility, purpose, or exhortation',
  Optative: 'expresses a wish or remote possibility',
  Imperative: 'gives a command or makes a request',
  Infinitive: 'a verbal noun — the basic idea of the action without person or number',
  Participle: 'a verbal adjective — combines verb action with adjectival function',
};

const DECLENSION_NOTES = {
  '1st': {
    label: '1st Declension',
    note: 'Mostly feminine nouns. Eta-type (ή) and alpha-type (α). Key endings: -η/-α (nom sg), -ης/-ας (gen sg), -ῃ/-ᾳ (dat sg), -ην/-αν (acc sg).',
  },
  '2nd': {
    label: '2nd Declension',
    note: 'Masculine (-ος) and neuter (-ον). Key pattern: -ος, -ου, -ῳ, -ον for masculine singular. Neuter nouns always have identical nominative and accusative forms.',
  },
  '3rd': {
    label: '3rd Declension',
    note: 'The most varied declension. Stems end in consonants, -ματ- (πνεῦμα), or vowels. The key is identifying the stem from the genitive singular form.',
  },
};

const CONJUGATION_NOTES = {
  'ω-verb': 'Regular thematic (ω) conjugation. Primary endings: -ω, -εις, -ει, -ομεν, -ετε, -ουσι(ν).',
  'μι-verb': 'Athematic (μι) conjugation. No thematic vowel. Uses -μι, -ς, -σι(ν), -μεν, -τε, -ασι(ν) in present active.',
  'μι-verb (irregular)': 'εἰμί is highly irregular. Present: εἰμί, εἶ, ἐστίν, ἐσμέν, ἐστέ, εἰσίν. Imperfect: ἤμην, ἦς, ἦν...',
  'contract (αω)': 'Alpha-contract verb. The stem vowel α contracts with the thematic vowel, producing characteristic long vowels (α+ε→α, α+ο→ω).',
  'contract (εω)': 'Epsilon-contract verb. The stem vowel ε contracts with endings (ε+ε→ει, ε+ο→ου).',
  'deponent': 'Deponent verb — middle/passive in form but active in meaning. These verbs have no active forms.',
  'ω-verb (suppletive aorist)': 'Uses a different stem in the aorist than in the present (suppletive). εἶπον is the aorist of λέγω.',
};

// Common confusion patterns
const CONFUSION_PATTERNS = {
  'noun:genitive-nominative': 'Watch out: 3rd declension genitive singular -ος looks like 2nd declension nominative singular -ος. Check the article or context to disambiguate.',
  'noun:dative-locative': 'The dative case in Greek serves as locative ("in/at"), instrumental ("by/with"), and dative proper ("to/for").',
  'noun:neuter-plural': 'Neuter plural subjects take singular verbs in Greek — this is normal, not a parsing error.',
  'verb:middle-passive': 'In the present, imperfect, perfect, and pluperfect, middle and passive forms are identical. Only context can tell you which voice is intended.',
  'verb:aorist-imperfect': 'Both are past tense, but aorist views the action as a simple whole, while imperfect emphasizes ongoing or repeated action in the past.',
};

export function generateNounExplanation(card, userAnswer = null) {
  const { parse, lemma, word, declension } = card;
  const lines = [];

  // Form identification
  lines.push(`**${word}** is the ${parse.case} ${parse.number} ${parse.gender} form of **${lemma}** ("${card.gloss}").`);

  // Declension info
  const declInfo = DECLENSION_NOTES[declension];
  if (declInfo) {
    lines.push(`It belongs to the **${declInfo.label}**. ${declInfo.note}`);
  }

  // Ending analysis
  lines.push(`The **${parse.case.toLowerCase()}** case signals ${CASE_EXPLANATIONS[parse.case]}.`);

  // Specific ending analysis based on morpheme
  const ending = getEnding(word, lemma, 'noun');
  if (ending) {
    lines.push(`The ending **-${ending}** marks this as ${parse.case.toLowerCase()} ${parse.number.toLowerCase()}.`);
  }

  // Confusion warnings
  if (userAnswer) {
    const confusionNote = getConfusionNote(card, userAnswer);
    if (confusionNote) lines.push(confusionNote);
  }

  // Ambiguity note
  if (card.ambiguityNote) {
    lines.push(`**Note:** ${card.ambiguityNote}`);
  }

  return lines.join('\n\n');
}

export function generateVerbExplanation(card, userAnswer = null) {
  const { parse, lemma, word } = card;
  const lines = [];

  // Form identification
  const personNum = parse.person ? `${parse.person} person ${parse.number.toLowerCase()}` : '';
  const parts = [personNum, parse.tense.toLowerCase(), parse.voice.toLowerCase(), parse.mood.toLowerCase()].filter(Boolean);
  lines.push(`**${word}** is the ${parts.join(' ')} form of **${lemma}** ("${card.gloss}").`);

  // Tense info
  lines.push(`The **${parse.tense.toLowerCase()} tense** indicates ${TENSE_EXPLANATIONS[parse.tense]}.`);

  // Voice info
  lines.push(`The **${parse.voice.toLowerCase()} voice** means ${VOICE_EXPLANATIONS[parse.voice]}.`);

  // Mood info
  lines.push(`The **${parse.mood.toLowerCase()} mood** ${MOOD_EXPLANATIONS[parse.mood]}.`);

  // Conjugation family
  const conjNote = CONJUGATION_NOTES[card.conjugation];
  if (conjNote) {
    lines.push(`**Conjugation:** ${conjNote}`);
  }

  // Participle extra info
  if (parse.mood === 'Participle' && parse.case) {
    lines.push(`As a participle, it also has nominal features: **${parse.case} ${parse.number} ${parse.gender}**.`);
  }

  // Ambiguity
  if (card.ambiguityNote) {
    lines.push(`**Note:** ${card.ambiguityNote}`);
  }

  return lines.join('\n\n');
}

function getEnding(word, lemma, type) {
  // Simple heuristic: find the ending after the stem
  if (word.length <= 2) return word;
  // Return last 2-3 characters as the ending
  if (word.length <= 4) return word.slice(-2);
  return word.slice(-3);
}

function getConfusionNote(card, userAnswer) {
  if (card.type === 'noun') {
    // Check for genitive/nominative confusion
    if (
      (card.parse.case === 'Genitive' && userAnswer.case === 'Nominative') ||
      (card.parse.case === 'Nominative' && userAnswer.case === 'Genitive')
    ) {
      if (card.declension === '3rd') {
        return CONFUSION_PATTERNS['noun:genitive-nominative'];
      }
    }
  }

  if (card.type === 'verb') {
    if (userAnswer.voice && card.parse.voice !== userAnswer.voice) {
      if (['Middle', 'Passive'].includes(card.parse.voice) && ['Middle', 'Passive'].includes(userAnswer.voice)) {
        return CONFUSION_PATTERNS['verb:middle-passive'];
      }
    }
    if (userAnswer.tense && card.parse.tense !== userAnswer.tense) {
      if (['Aorist', 'Imperfect'].includes(card.parse.tense) && ['Aorist', 'Imperfect'].includes(userAnswer.tense)) {
        return CONFUSION_PATTERNS['verb:aorist-imperfect'];
      }
    }
  }

  return null;
}
