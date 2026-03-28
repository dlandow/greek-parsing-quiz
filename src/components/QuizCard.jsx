import { useState } from 'react';
import { generateNounExplanation, generateVerbExplanation } from '../utils/explanations';
import { splitMorpheme } from '../utils/morphemes';
import { NOUN_PARADIGMS, VERB_PARADIGMS } from '../utils/paradigms';

const NOUN_CATEGORIES = {
  case: ['Nominative', 'Genitive', 'Dative', 'Accusative'],
  number: ['Singular', 'Plural'],
  gender: ['Masculine', 'Feminine', 'Neuter'],
};

const VERB_CATEGORIES = {
  person: ['1st', '2nd', '3rd'],
  number: ['Singular', 'Plural'],
  tense: ['Present', 'Imperfect', 'Aorist', 'Perfect', 'Pluperfect', 'Future'],
  voice: ['Active', 'Middle', 'Passive'],
  mood: ['Indicative', 'Subjunctive', 'Optative', 'Imperative', 'Infinitive', 'Participle'],
};

// Which categories to show based on focus mode
function getActiveCategories(card, focusCategory) {
  if (card.type === 'noun') {
    switch (focusCategory) {
      case 'case': return ['case'];
      case 'case-number': return ['case', 'number'];
      default: return ['case', 'number', 'gender'];
    }
  }
  // verb
  // Participles ALWAYS need case/number/gender (they're verbal adjectives)
  const isParticiple = card.parse.mood === 'Participle';

  switch (focusCategory) {
    case 'tense': return isParticiple ? ['tense', 'case', 'number', 'gender'] : ['tense'];
    case 'tense-voice': return isParticiple ? ['tense', 'voice', 'case', 'number', 'gender'] : ['tense', 'voice'];
    case 'tense-voice-mood': return isParticiple ? ['tense', 'voice', 'mood', 'case', 'number', 'gender'] : ['tense', 'voice', 'mood'];
    default: {
      // For infinitives, no person/number
      if (card.parse.mood === 'Infinitive') return ['tense', 'voice', 'mood'];
      // For participles, no person — but add case/number/gender
      if (isParticiple) return ['tense', 'voice', 'mood', 'case', 'number', 'gender'];
      return ['person', 'number', 'tense', 'voice', 'mood'];
    }
  }
}

export default function QuizCard({ card, focusCategory, selectedForms, fontSize, onAnswer }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null); // { correct, wrongCategories }
  const [retryUsed, setRetryUsed] = useState(false);
  const [showingRetry, setShowingRetry] = useState(false);

  // Hints state
  const [hintsRevealed, setHintsRevealed] = useState({
    translation: false,
    lemma: false,
    gloss: false,
    declension: false,
    paradigm: false,
  });
  const [allHints, setAllHints] = useState(false);
  const [showParadigm, setShowParadigm] = useState(false);

  // Merge noun + verb categories so participles can access case/number/gender
  const categories = card.type === 'noun' ? NOUN_CATEGORIES : { ...VERB_CATEGORIES, ...NOUN_CATEGORIES };
  const activeCategories = getActiveCategories(card, focusCategory);

  const allCategoriesToAnswer = activeCategories;

  // Check if all required categories are answered
  const allAnswered = allCategoriesToAnswer.every(cat => answers[cat]);

  function handleSelect(category, value) {
    if (submitted && !showingRetry) return;
    setAnswers(prev => ({ ...prev, [category]: value }));
  }

  function handleSubmit() {
    const wrongCategories = [];
    let allCorrect = true;

    for (const cat of allCategoriesToAnswer) {
      const userVal = answers[cat];
      let correctVal;

      correctVal = card.parse[cat];

      // Check ambiguous parses
      if (card.ambiguousParses) {
        const anyMatch = card.ambiguousParses.some(parse => {
          if (cat === 'number_ptcp') return parse.number === userVal;
          return parse[cat] === userVal;
        });
        if (!anyMatch) {
          allCorrect = false;
          wrongCategories.push(cat);
        }
      } else {
        if (userVal !== correctVal) {
          allCorrect = false;
          wrongCategories.push(cat);
        }
      }
    }

    setResult({ correct: allCorrect, wrongCategories });
    setSubmitted(true);
  }

  function handleRetry() {
    setRetryUsed(true);
    setShowingRetry(true);
    setSubmitted(false);
    setResult(null);
    // Keep the correct answers, clear the wrong ones
    const newAnswers = { ...answers };
    for (const cat of result.wrongCategories) {
      delete newAnswers[cat];
    }
    setAnswers(newAnswers);
  }

  function handleNext() {
    onAnswer({
      correct: result.correct,
      firstAttempt: !retryUsed,
      wrongCategories: result?.wrongCategories || [],
    });
  }

  function revealHint(key) {
    setHintsRevealed(prev => ({ ...prev, [key]: true }));
  }

  function revealAll() {
    setAllHints(true);
    setHintsRevealed({ translation: true, lemma: true, gloss: true, declension: true, paradigm: true });
  }

  // Find the relevant paradigm for this card
  function getRelevantParadigm() {
    if (card.type === 'noun') {
      const decl = card.declension;
      if (decl === '1st') {
        // Check if eta or alpha type based on lemma
        const lemma = card.lemma;
        if (lemma.endsWith('η') || lemma.endsWith('ή')) return NOUN_PARADIGMS.find(p => p.id === '1st-eta');
        return NOUN_PARADIGMS.find(p => p.id === '1st-alpha');
      }
      if (decl === '2nd') {
        if (card.parse.gender === 'Neuter') return NOUN_PARADIGMS.find(p => p.id === '2nd-neut');
        return NOUN_PARADIGMS.find(p => p.id === '2nd-masc');
      }
      if (decl === '3rd') {
        if (card.lemma.endsWith('μα')) return NOUN_PARADIGMS.find(p => p.id === '3rd-mat');
        const irreg = NOUN_PARADIGMS.find(p => p.id === '3rd-irregular');
        if (irreg && irreg.subtitle && irreg.subtitle.includes(card.lemma)) return irreg;
        return NOUN_PARADIGMS.find(p => p.id === '3rd-consonant');
      }
    }
    if (card.type === 'verb') {
      const { tense, voice, mood } = card.parse;
      // Participles
      if (mood === 'Participle') {
        if (voice === 'Passive' && tense === 'Aorist') return VERB_PARADIGMS.find(p => p.id === 'participle-aor-pass');
        if (tense === 'Aorist') return VERB_PARADIGMS.find(p => p.id === 'participle-aor-act');
        if (tense === 'Perfect') return VERB_PARADIGMS.find(p => p.id === 'participle-perf-act');
        if (voice === 'Middle' || voice === 'Passive') return VERB_PARADIGMS.find(p => p.id === 'participle-pres-mid-pass');
        return VERB_PARADIGMS.find(p => p.id === 'participle-pres-act');
      }
      // Finite moods
      if (mood === 'Subjunctive') return VERB_PARADIGMS.find(p => p.id === 'subjunctive');
      if (mood === 'Imperative') return VERB_PARADIGMS.find(p => p.id === 'imperative');
      // Tenses
      if (tense === 'Future') return VERB_PARADIGMS.find(p => p.id === 'fut-act-ind');
      if (tense === 'Perfect' || tense === 'Pluperfect') return VERB_PARADIGMS.find(p => p.id === 'perf-act-ind');
      if (tense === 'Aorist' && voice === 'Middle') return VERB_PARADIGMS.find(p => p.id === 'aor-mid-ind');
      if (tense === 'Aorist') return VERB_PARADIGMS.find(p => p.id === 'aor-act-ind');
      if (tense === 'Imperfect') return VERB_PARADIGMS.find(p => p.id === 'impf-act-ind');
      if (voice === 'Middle' || voice === 'Passive') return VERB_PARADIGMS.find(p => p.id === 'pres-mid-pass-ind');
      // Check if mi-verb
      if (card.conjugation && card.conjugation.includes('μι')) return VERB_PARADIGMS.find(p => p.id === 'pres-act-ind-mi');
      return VERB_PARADIGMS.find(p => p.id === 'pres-act-ind-omega');
    }
    return null;
  }

  const explanation = card.type === 'noun'
    ? generateNounExplanation(card, submitted ? answers : null)
    : generateVerbExplanation(card, submitted ? answers : null);

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Scripture reference */}
      <p className="text-sm text-stone-400 dark:text-stone-500 mb-3 text-center">
        {card.reference}
      </p>

      {/* Greek sentence */}
      <div className="mb-6 text-center leading-relaxed" style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: `${fontSize}px` }}>
        {card.sentence.map((w, i) => (
          <span key={i}>
            {i === card.targetIndex ? (
              <HighlightedWord word={w} card={card} submitted={submitted} />
            ) : (
              <span className="text-stone-600 dark:text-stone-400">{cleanText(w)}</span>
            )}
            {i < card.sentence.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>

      {/* Hints */}
      <div className="mb-6 space-y-2">
        {/* Translation hint - full width */}
        {card.translation && (
          <div className="flex justify-center">
            <HintButton
              label="Translation (ESV)"
              revealed={hintsRevealed.translation || allHints}
              content={card.translation}
              onReveal={() => revealHint('translation')}
              fullWidth
            />
          </div>
        )}

        {/* Other hints in a row */}
        <div className="flex flex-wrap gap-2 justify-center">
          <HintButton
            label="Lemma"
            revealed={hintsRevealed.lemma || allHints}
            content={card.lemma}
            onReveal={() => revealHint('lemma')}
            greek
          />
          <HintButton
            label="Gloss"
            revealed={hintsRevealed.gloss || allHints}
            content={`"${card.gloss}"`}
            onReveal={() => revealHint('gloss')}
          />
          <HintButton
            label={card.type === 'noun' ? 'Declension' : 'Conjugation'}
            revealed={hintsRevealed.declension || allHints}
            content={card.type === 'noun' ? `${card.declension} declension` : card.conjugation}
            onReveal={() => revealHint('declension')}
          />
          <button
            onClick={() => setShowParadigm(!showParadigm)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showParadigm
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-300 dark:ring-indigo-700'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-600 border border-dashed border-stone-300 dark:border-stone-600'
            }`}
          >
            {showParadigm ? 'Hide Paradigm' : 'Paradigm'}
          </button>
          {!allHints && (
            <button
              onClick={revealAll}
              className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              Reveal all
            </button>
          )}
        </div>
      </div>

      {/* Inline paradigm table */}
      {showParadigm && <InlineParadigm card={card} getRelevantParadigm={getRelevantParadigm} />}

      {/* Parsing buttons */}
      <div className="space-y-4 mb-6">
        {activeCategories.map(cat => (
          <CategoryRow
            key={cat}
            category={cat}
            options={categories[cat]}
            selected={answers[cat]}
            onSelect={(val) => handleSelect(cat, val)}
            correctValue={submitted ? card.parse[cat] : null}
            isWrong={submitted && result?.wrongCategories.includes(cat)}
            disabled={submitted && !showingRetry}
            givenAnswers={submitted ? answers : null}
            ambiguousParses={card.ambiguousParses}
          />
        ))}

        {/* Participle case/number/gender are now handled in activeCategories */}
      </div>

      {/* Submit / Retry / Next */}
      <div className="flex justify-center gap-3 mb-6">
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`px-8 py-3 rounded-xl font-medium transition-colors ${
              allAnswered
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-stone-300 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        )}

        {submitted && !result.correct && !retryUsed && (
          <>
            <button
              onClick={handleRetry}
              className="px-8 py-3 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleNext}
              className="px-8 py-3 rounded-xl font-medium bg-stone-600 hover:bg-stone-700 text-white transition-colors"
            >
              Skip
            </button>
          </>
        )}

        {submitted && (result.correct || retryUsed) && (
          <button
            onClick={handleNext}
            className="px-8 py-3 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            Next
          </button>
        )}
      </div>

      {/* Feedback / Explanation */}
      {submitted && (
        <div className={`p-4 rounded-xl mb-8 ${
          result.correct
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
        }`}>
          <p className="font-semibold mb-2 text-stone-900 dark:text-stone-100">
            {result.correct ? 'Correct!' : 'Not quite.'}
          </p>
          <div className="text-sm text-stone-700 dark:text-stone-300 space-y-2 whitespace-pre-line explanation-content">
            {explanation.split('\n\n').map((para, i) => (
              <p key={i} dangerouslySetInnerHTML={{
                __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryRow({ category, label, options, selected, onSelect, correctValue, isWrong, disabled, givenAnswers, ambiguousParses }) {
  const displayLabel = label || category.replace('_ptcp', '').charAt(0).toUpperCase() + category.replace('_ptcp', '').slice(1);

  return (
    <div>
      <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">{displayLabel}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          let btnClass = 'px-3 py-2 rounded-lg text-sm font-medium transition-all ';

          if (disabled && correctValue) {
            // Show results
            const isCorrectOption = ambiguousParses
              ? ambiguousParses.some(p => (category === 'number_ptcp' ? p.number : p[category]) === opt)
              : opt === correctValue;
            const wasSelected = opt === selected;

            if (isCorrectOption && wasSelected) {
              btnClass += 'bg-emerald-500 text-white ring-2 ring-emerald-600';
            } else if (isCorrectOption) {
              btnClass += 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400';
            } else if (wasSelected && !isCorrectOption) {
              btnClass += 'bg-red-400 text-white ring-2 ring-red-500';
            } else {
              btnClass += 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500';
            }
          } else if (opt === selected) {
            btnClass += 'bg-indigo-600 text-white ring-2 ring-indigo-500';
          } else {
            btnClass += 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600';
          }

          return (
            <button
              key={opt}
              onClick={() => !disabled && onSelect(opt)}
              className={btnClass}
              disabled={disabled}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Clean textual apparatus markers from MorphGNT
function cleanText(text) {
  return text.replace(/[⸂⸃⸀⸁⸄⸅\[\]]/g, '');
}

// Render the target word with stem/ending color-coding
function HighlightedWord({ word, card, submitted }) {
  const cleaned = cleanText(word);
  const morpheme = splitMorpheme(card.word, card);

  // Before submission or if we can't split, show as single highlighted unit
  if (!submitted || !morpheme) {
    return (
      <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 decoration-2">
        {cleaned}
      </span>
    );
  }

  // After submission, show stem + ending in different colors
  if (morpheme.augment) {
    return (
      <span className="underline underline-offset-4 decoration-2 decoration-indigo-400">
        <span className="text-sky-500 dark:text-sky-400">{morpheme.augment}</span>
        <span className="text-indigo-600 dark:text-indigo-400">{morpheme.stem}</span>
        <span className="text-amber-500 dark:text-amber-400 font-semibold">{morpheme.ending}</span>
      </span>
    );
  }

  return (
    <span className="underline underline-offset-4 decoration-2 decoration-indigo-400">
      <span className="text-indigo-600 dark:text-indigo-400">{morpheme.stem}</span>
      <span className="text-amber-500 dark:text-amber-400 font-semibold">{morpheme.ending}</span>
    </span>
  );
}

function HintButton({ label, revealed, content, onReveal, fullWidth, greek }) {
  if (revealed) {
    return (
      <span
        className={`px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm text-stone-600 dark:text-stone-400 ${
          fullWidth ? 'block text-center' : 'inline-block'
        }`}
        style={greek ? { fontFamily: "'Gentium Plus', 'GFS Didot', serif" } : {}}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      onClick={onReveal}
      className={`px-3 py-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors border border-dashed border-stone-300 dark:border-stone-600 ${
        fullWidth ? 'block w-full text-center' : ''
      }`}
    >
      {label}
    </button>
  );
}

function InlineParadigm({ card, getRelevantParadigm }) {
  const paradigm = getRelevantParadigm();
  if (!paradigm) {
    return (
      <div className="mb-6 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl text-sm text-stone-500 text-center">
        No paradigm table available for this form.
      </div>
    );
  }

  // Determine which cell to highlight based on the card's parse
  // Also track the highlighted cell content for comparison
  let highlightedEnding = null;
  let highlightedLabel = null;

  function shouldHighlight(rowLabel, colIndex) {
    if (!rowLabel) return false;
    const row = rowLabel.toLowerCase();
    const parse = card.parse;

    if (card.type === 'noun') {
      const caseAbbrevs = { nominative: 'nom', genitive: 'gen', dative: 'dat', accusative: 'acc' };
      const caseAbbr = parse.case ? caseAbbrevs[parse.case.toLowerCase()] : null;
      const caseMatch = parse.case && (row.includes(parse.case.toLowerCase()) || (caseAbbr && row.includes(caseAbbr)));
      if (!caseMatch) return false;
      // Handle rows with number in label (e.g. "Nom sg", "Gen pl")
      const numAbbr = parse.number === 'Singular' ? 'sg' : 'pl';
      if (row.includes('sg') || row.includes('pl')) {
        return row.includes(numAbbr) && colIndex >= 1;
      }
      if (paradigm.headers.length === 3) {
        if (parse.number === 'Singular' && colIndex === 1) return true;
        if (parse.number === 'Plural' && colIndex === 2) return true;
      }
      return paradigm.headers.length <= 2;
    }

    if (card.type === 'verb') {
      const parse = card.parse;
      const mood = parse.mood;

      if (mood === 'Participle') {
        // Participle paradigms: rows are "Nom sg", "Gen pl", etc. Columns are Masc, Fem, Neut.
        const caseAbbrevs = { nominative: 'nom', genitive: 'gen', dative: 'dat', accusative: 'acc' };
        const caseAbbr = parse.case ? caseAbbrevs[parse.case.toLowerCase()] : null;
        const caseMatch = caseAbbr && row.includes(caseAbbr);
        const numAbbr = parse.number === 'Singular' ? 'sg' : 'pl';
        const numMatch = row.includes(numAbbr);
        if (!caseMatch || !numMatch) return false;
        const colHeader = (paradigm.headers[colIndex] || '').toLowerCase();
        if (parse.gender === 'Masculine' && colHeader.startsWith('masc')) return true;
        if (parse.gender === 'Feminine' && colHeader.startsWith('fem')) return true;
        if (parse.gender === 'Neuter' && colHeader.startsWith('neut')) return true;
        return false;
      }

      // Finite verbs: rows are person (1st, 2nd, 3rd) or "1st sg", "2nd pl", etc.
      const personMatch = parse.person && row.includes(parse.person.toLowerCase());
      if (!personMatch) return false;
      // If row label includes number (e.g. "1st sg", "1st pl"), match both person AND number
      if (row.includes('sg') || row.includes('pl')) {
        const numAbbr = parse.number === 'Singular' ? 'sg' : 'pl';
        return row.includes(numAbbr) && colIndex >= 1;
      }
      // Columns are Singular/Plural (e.g. Present Active Indicative)
      if (paradigm.headers.length === 3) {
        if (parse.number === 'Singular' && colIndex === 1) return true;
        if (parse.number === 'Plural' && colIndex === 2) return true;
      }
      return paradigm.headers.length <= 2;
    }
    return false;
  }

  // Pre-scan to find the highlighted cell
  paradigm.rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      if (ci > 0 && shouldHighlight(row[0], ci)) {
        highlightedEnding = cell;
        highlightedLabel = row[0];
      }
    });
  });

  // Build the "this verb" comparison for irregular forms
  const actualForm = cleanText(card.word || card.textForm || '');
  const showComparison = card.type === 'verb' && highlightedEnding && actualForm;

  return (
    <div className="mb-6 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">{paradigm.title}</p>
      {paradigm.subtitle && (
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">{paradigm.subtitle}</p>
      )}
      {paradigm.note && (
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 italic">{paradigm.note}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {paradigm.headers.map((h, i) => (
                <th key={i} className="px-2 py-1 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paradigm.rows.map((row, ri) => (
              <tr key={ri} className="border-t border-stone-200 dark:border-stone-700">
                {row.map((cell, ci) => {
                  const highlight = ci > 0 && shouldHighlight(row[0], ci);
                  return (
                    <td
                      key={ci}
                      className={`px-2 py-1.5 ${
                        ci === 0
                          ? 'text-stone-600 dark:text-stone-400 font-medium'
                          : 'text-stone-700 dark:text-stone-300'
                      } ${
                        highlight
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold rounded'
                          : ''
                      }`}
                      style={{ fontFamily: ci > 0 ? "'Gentium Plus', 'GFS Didot', serif" : undefined }}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show actual form vs regular ending for this verb */}
      {showComparison && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/50">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5">
            This verb: {card.lemma}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif" }}>
            <span className="text-stone-600 dark:text-stone-400">
              <span className="text-xs font-sans font-medium text-stone-500 dark:text-stone-500 mr-1">Regular pattern:</span>
              {highlightedEnding}
            </span>
            <span className="text-amber-700 dark:text-amber-300 font-semibold">
              <span className="text-xs font-sans font-medium text-amber-600 dark:text-amber-500 mr-1">Actual form:</span>
              {actualForm}
            </span>
          </div>
        </div>
      )}

      {paradigm.examples && (
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400" style={{ fontFamily: "'Gentium Plus', serif" }}>
          {paradigm.examples}
        </p>
      )}
    </div>
  );
}
