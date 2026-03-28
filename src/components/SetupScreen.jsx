import { useState, useMemo } from 'react';
import { filterNounCards, filterVerbCards } from '../utils/cardSelection';

const ALL_VERBS = [
  'εἰμί', 'λέγω', 'ἔχω', 'εἶπον', 'γίνομαι', 'ὁράω', 'ἀκούω',
  'πιστεύω', 'ἔρχομαι', 'ποιέω', 'δίδωμι', 'ἀποκρίνομαι',
  'γράφω', 'λαμβάνω', 'ἀγαπάω', 'ζάω', 'ἐγείρω', 'βαπτίζω',
];

const ALL_NOUN_LEMMAS = [
  'λόγος', 'θεός', 'κόσμος', 'νόμος', 'υἱός', 'κύριος', 'ἄνθρωπος',
  'ἔργον', 'εὐαγγέλιον', 'τέκνον',
  'ἀρχή', 'ζωή', 'δόξα', 'ἐκκλησία', 'γραφή', 'ἀλήθεια', 'χαρά',
  'σάρξ', 'πνεῦμα', 'χάρις', 'αἰών', 'πατήρ', 'σωτήρ', 'βασιλεύς',
];

export default function SetupScreen({ cardData, onStart, onBack, savedSettings, onSaveSettings }) {
  const [mode, setMode] = useState(savedSettings?.mode || 'nouns');
  const [declension, setDeclension] = useState(savedSettings?.declension || 'all');
  const [difficulty, setDifficulty] = useState(savedSettings?.difficulty || 2);
  const [tenseGroup, setTenseGroup] = useState(savedSettings?.tenseGroup || 'all');
  const [moodGroup, setMoodGroup] = useState(savedSettings?.moodGroup || 'all');
  const [selectedVerbs, setSelectedVerbs] = useState(savedSettings?.selectedVerbs || []);
  const [selectedNouns, setSelectedNouns] = useState(savedSettings?.selectedNouns || []);
  const [roundLength, setRoundLength] = useState(savedSettings?.roundLength || 10);
  const [randomMode, setRandomMode] = useState(false);
  const [focusCategory, setFocusCategory] = useState(savedSettings?.focusCategory || 'all');

  // Granular noun filters
  const [selectedCases, setSelectedCases] = useState(savedSettings?.selectedCases || []);
  const [selectedGenders, setSelectedGenders] = useState(savedSettings?.selectedGenders || []);
  const [selectedNumbers, setSelectedNumbers] = useState(savedSettings?.selectedNumbers || []);

  // Verb form picker: array of "Tense Voice Mood" strings like "Present Active Indicative"
  const [selectedForms, setSelectedForms] = useState(savedSettings?.selectedForms || []);

  // Expand/collapse for advanced filters
  const [showNounAdvanced, setShowNounAdvanced] = useState(false);

  const poolSize = useMemo(() => {
    let pool = 0;
    if (mode === 'nouns' || mode === 'both') {
      pool += filterNounCards(cardData.nouns, {
        declension, difficulty,
        selectedNouns: selectedNouns.length > 0 ? selectedNouns : null,
        selectedCases: selectedCases.length > 0 ? selectedCases : null,
        selectedGenders: selectedGenders.length > 0 ? selectedGenders : null,
        selectedNumbers: selectedNumbers.length > 0 ? selectedNumbers : null,
      }).length;
    }
    if (mode === 'verbs' || mode === 'both') {
      pool += filterVerbCards(cardData.verbs, {
        selectedVerbs: selectedVerbs.length > 0 ? selectedVerbs : null,
        selectedForms: selectedForms.length > 0 ? selectedForms : null,
      }).length;
    }
    return pool;
  }, [mode, declension, difficulty, selectedVerbs, selectedNouns,
      selectedCases, selectedGenders, selectedNumbers, selectedForms, cardData]);

  function handleStart() {
    const config = {
      mode, declension, difficulty,
      selectedVerbs: selectedVerbs.length > 0 ? selectedVerbs : null,
      selectedNouns: selectedNouns.length > 0 ? selectedNouns : null,
      selectedCases: selectedCases.length > 0 ? selectedCases : null,
      selectedGenders: selectedGenders.length > 0 ? selectedGenders : null,
      selectedNumbers: selectedNumbers.length > 0 ? selectedNumbers : null,
      selectedForms: selectedForms.length > 0 ? selectedForms : null,
      roundLength, random: randomMode, focusCategory,
    };
    onSaveSettings(config);
    onStart(config);
  }

  function toggleInList(list, setList, val) {
    setList(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={onBack} className="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 mb-6 flex items-center gap-1">
        <span>&larr;</span> Back
      </button>

      <h2 className="text-2xl font-semibold mb-6 text-stone-900 dark:text-stone-100">Session Setup</h2>

      {/* Mode */}
      <Section title="Mode">
        <ButtonGroup
          options={[
            { value: 'nouns', label: 'Nouns' },
            { value: 'verbs', label: 'Verbs' },
            { value: 'both', label: 'Both' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </Section>

      {/* Focus Mode */}
      <Section title="Focus Mode" subtitle="Drill one category at a time to build skills gradually">
        {mode === 'verbs' ? (
          <ButtonGroup
            options={[
              { value: 'all', label: 'Full Parse' },
              { value: 'tense', label: 'Tense Only' },
              { value: 'tense-voice', label: 'Tense + Voice' },
              { value: 'tense-voice-mood', label: 'Tense + Voice + Mood' },
            ]}
            value={focusCategory}
            onChange={setFocusCategory}
          />
        ) : (
          <ButtonGroup
            options={[
              { value: 'all', label: 'Full Parse' },
              { value: 'case', label: 'Case Only' },
              { value: 'case-number', label: 'Case + Number' },
            ]}
            value={focusCategory}
            onChange={setFocusCategory}
          />
        )}
      </Section>

      {/* ==================== NOUN FILTERS ==================== */}
      {(mode === 'nouns' || mode === 'both') && (
        <>
          <Section title="Declension">
            <ButtonGroup
              options={[
                { value: 'all', label: 'All' },
                { value: '1st', label: '1st' },
                { value: '2nd', label: '2nd' },
                { value: '3rd', label: '3rd' },
              ]}
              value={declension}
              onChange={setDeclension}
            />
          </Section>

          <Section title="Difficulty" subtitle="1 = regular 1st/2nd only, 2 = adds 3rd decl & ambiguous neuter, 3 = all forms">
            <ButtonGroup
              options={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
              ]}
              value={difficulty}
              onChange={setDifficulty}
            />
          </Section>

          {/* Advanced noun filters - collapsible */}
          <div className="mb-6">
            <button
              onClick={() => setShowNounAdvanced(!showNounAdvanced)}
              className="text-sm text-indigo-500 hover:text-indigo-400 flex items-center gap-1 mb-2"
            >
              <span className={`transition-transform ${showNounAdvanced ? 'rotate-90' : ''}`}>&#9654;</span>
              {showNounAdvanced ? 'Hide' : 'Show'} advanced noun filters
            </button>

            {showNounAdvanced && (
              <div className="space-y-4 pl-2 border-l-2 border-stone-200 dark:border-stone-700">
                {/* Specific nouns */}
                <div>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Specific Nouns</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_NOUN_LEMMAS.filter(n => {
                      // Only show nouns that exist in the data
                      return cardData.nouns.some(c => c.lemma === n);
                    }).map(n => (
                      <button
                        key={n}
                        onClick={() => toggleInList(selectedNouns, setSelectedNouns, n)}
                        className={`px-2.5 py-1 rounded-lg text-sm transition-colors ${
                          selectedNouns.includes(n)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                        }`}
                        style={{ fontFamily: "'Gentium Plus', serif" }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {selectedNouns.length === 0 && (
                    <p className="text-xs text-stone-400 mt-1">All nouns included (click to filter)</p>
                  )}
                </div>

                {/* Case filter */}
                <div>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Case</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Nominative', 'Genitive', 'Dative', 'Accusative', 'Vocative'].map(c => (
                      <button
                        key={c}
                        onClick={() => toggleInList(selectedCases, setSelectedCases, c)}
                        className={`px-2.5 py-1 rounded-lg text-sm transition-colors ${
                          selectedCases.includes(c)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {selectedCases.length === 0 && <p className="text-xs text-stone-400 mt-1">All cases</p>}
                </div>

                {/* Gender filter */}
                <div>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Gender</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Masculine', 'Feminine', 'Neuter'].map(g => (
                      <button
                        key={g}
                        onClick={() => toggleInList(selectedGenders, setSelectedGenders, g)}
                        className={`px-2.5 py-1 rounded-lg text-sm transition-colors ${
                          selectedGenders.includes(g)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {selectedGenders.length === 0 && <p className="text-xs text-stone-400 mt-1">All genders</p>}
                </div>

                {/* Number filter */}
                <div>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Number</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Singular', 'Plural'].map(n => (
                      <button
                        key={n}
                        onClick={() => toggleInList(selectedNumbers, setSelectedNumbers, n)}
                        className={`px-2.5 py-1 rounded-lg text-sm transition-colors ${
                          selectedNumbers.includes(n)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {selectedNumbers.length === 0 && <p className="text-xs text-stone-400 mt-1">Both</p>}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== VERB FILTERS ==================== */}
      {(mode === 'verbs' || mode === 'both') && (
        <>
          {/* Verb Form Picker */}
          <VerbFormPicker
            cardData={cardData}
            selectedForms={selectedForms}
            setSelectedForms={setSelectedForms}
            selectedVerbs={selectedVerbs}
            setSelectedVerbs={setSelectedVerbs}
            toggleInList={toggleInList}
          />
        </>
      )}

      {/* Round Length */}
      <Section title="Round Length">
        <ButtonGroup
          options={[
            { value: 5, label: '5' },
            { value: 10, label: '10' },
            { value: 15, label: '15' },
            { value: 20, label: '20' },
          ]}
          value={roundLength}
          onChange={setRoundLength}
        />
      </Section>

      {/* Random toggle */}
      <Section title="Card Selection">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={randomMode}
            onChange={e => setRandomMode(e.target.checked)}
            className="w-5 h-5 rounded accent-indigo-600"
          />
          <span className="text-stone-600 dark:text-stone-400">
            Random mode (ignore weakness weighting)
          </span>
        </label>
      </Section>

      {/* Pool count and start */}
      <div className="mt-8 flex flex-col gap-3">
        <p className="text-center text-stone-500 dark:text-stone-400">
          <span className="text-lg font-semibold text-stone-700 dark:text-stone-300">{poolSize}</span> cards match your filters
        </p>

        <button
          onClick={handleStart}
          disabled={poolSize === 0}
          className={`w-full py-4 rounded-xl text-lg font-medium transition-colors ${
            poolSize > 0
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-stone-300 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
          }`}
        >
          {poolSize > 0 ? 'Begin' : 'No cards match'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {subtitle && <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">{subtitle}</p>}
      {children}
    </div>
  );
}

function ButtonGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-indigo-600 text-white'
              : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const TENSES = ['Present', 'Imperfect', 'Aorist', 'Perfect', 'Pluperfect', 'Future'];
const VOICES = ['Active', 'Middle', 'Passive'];
const MOODS = ['Indicative', 'Subjunctive', 'Imperative', 'Infinitive', 'Participle', 'Optative'];

function VerbFormPicker({ cardData, selectedForms, setSelectedForms, selectedVerbs, setSelectedVerbs, toggleInList }) {
  // Build a map of form -> count from data
  const formCounts = useMemo(() => {
    const counts = {};
    cardData.verbs.forEach(v => {
      const key = `${v.parse.tense} ${v.parse.voice} ${v.parse.mood}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [cardData]);

  function toggleForm(formKey) {
    setSelectedForms(prev =>
      prev.includes(formKey) ? prev.filter(f => f !== formKey) : [...prev, formKey]
    );
  }

  // Select all forms for a given mood
  function toggleMood(mood) {
    const moodForms = [];
    TENSES.forEach(t => VOICES.forEach(v => {
      const key = `${t} ${v} ${mood}`;
      if (formCounts[key]) moodForms.push(key);
    }));
    const allSelected = moodForms.every(f => selectedForms.includes(f));
    if (allSelected) {
      setSelectedForms(prev => prev.filter(f => !moodForms.includes(f)));
    } else {
      setSelectedForms(prev => [...new Set([...prev, ...moodForms])]);
    }
  }

  // Select all forms for a given tense
  function toggleTense(tense) {
    const tenseForms = [];
    VOICES.forEach(v => MOODS.forEach(m => {
      const key = `${tense} ${v} ${m}`;
      if (formCounts[key]) tenseForms.push(key);
    }));
    const allSelected = tenseForms.every(f => selectedForms.includes(f));
    if (allSelected) {
      setSelectedForms(prev => prev.filter(f => !tenseForms.includes(f)));
    } else {
      setSelectedForms(prev => [...new Set([...prev, ...tenseForms])]);
    }
  }

  // Select all forms for a given voice
  function toggleVoice(voice) {
    const voiceForms = [];
    TENSES.forEach(t => MOODS.forEach(m => {
      const key = `${t} ${voice} ${m}`;
      if (formCounts[key]) voiceForms.push(key);
    }));
    const allSelected = voiceForms.every(f => selectedForms.includes(f));
    if (allSelected) {
      setSelectedForms(prev => prev.filter(f => !voiceForms.includes(f)));
    } else {
      setSelectedForms(prev => [...new Set([...prev, ...voiceForms])]);
    }
  }

  return (
    <>
      <Section title="Verb Forms" subtitle="Pick the exact tense-voice-mood combinations you want to drill">
        {/* Quick select row */}
        <div className="mb-4">
          <p className="text-xs text-stone-400 mb-2">Quick select by tense:</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {TENSES.map(t => {
              const tenseForms = [];
              VOICES.forEach(v => MOODS.forEach(m => {
                const key = `${t} ${v} ${m}`;
                if (formCounts[key]) tenseForms.push(key);
              }));
              const allSelected = tenseForms.length > 0 && tenseForms.every(f => selectedForms.includes(f));
              const someSelected = tenseForms.some(f => selectedForms.includes(f));
              return (
                <button
                  key={t}
                  onClick={() => toggleTense(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    allSelected
                      ? 'bg-indigo-600 text-white'
                      : someSelected
                        ? 'bg-indigo-400/30 text-indigo-300 ring-1 ring-indigo-500'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-stone-400 mb-2">Quick select by voice / type:</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(() => {
              // Participles quick select
              const partForms = [];
              TENSES.forEach(t => VOICES.forEach(v => {
                const key = `${t} ${v} Participle`;
                if (formCounts[key]) partForms.push(key);
              }));
              const allSelected = partForms.length > 0 && partForms.every(f => selectedForms.includes(f));
              const someSelected = partForms.some(f => selectedForms.includes(f));
              return (
                <button
                  onClick={() => {
                    if (allSelected) {
                      setSelectedForms(prev => prev.filter(f => !partForms.includes(f)));
                    } else {
                      setSelectedForms(prev => [...new Set([...prev, ...partForms])]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    allSelected
                      ? 'bg-amber-600 text-white'
                      : someSelected
                        ? 'bg-amber-400/30 text-amber-300 ring-1 ring-amber-500'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                  }`}
                >
                  All Participles ({partForms.reduce((sum, f) => sum + (formCounts[f] || 0), 0)})
                </button>
              );
            })()}
          </div>

          <p className="text-xs text-stone-400 mb-2">Quick select by voice:</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {VOICES.map(v => {
              const voiceForms = [];
              TENSES.forEach(t => MOODS.forEach(m => {
                const key = `${t} ${v} ${m}`;
                if (formCounts[key]) voiceForms.push(key);
              }));
              const allSelected = voiceForms.length > 0 && voiceForms.every(f => selectedForms.includes(f));
              const someSelected = voiceForms.some(f => selectedForms.includes(f));
              return (
                <button
                  key={v}
                  onClick={() => toggleVoice(v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    allSelected
                      ? 'bg-indigo-600 text-white'
                      : someSelected
                        ? 'bg-indigo-400/30 text-indigo-300 ring-1 ring-indigo-500'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid by mood */}
        {MOODS.map(mood => {
          const moodForms = [];
          TENSES.forEach(t => VOICES.forEach(v => {
            const key = `${t} ${v} ${mood}`;
            if (formCounts[key]) moodForms.push(key);
          }));
          if (moodForms.length === 0) return null;

          const allMoodSelected = moodForms.every(f => selectedForms.includes(f));

          return (
            <div key={mood} className="mb-4">
              <button
                onClick={() => toggleMood(mood)}
                className={`text-xs font-semibold uppercase tracking-wider mb-1.5 px-2 py-0.5 rounded transition-colors ${
                  allMoodSelected
                    ? 'bg-indigo-600 text-white'
                    : 'text-stone-500 dark:text-stone-400 hover:text-indigo-400'
                }`}
              >
                {mood}
              </button>
              <div className="flex flex-wrap gap-1.5">
                {TENSES.map(tense =>
                  VOICES.map(voice => {
                    const key = `${tense} ${voice} ${mood}`;
                    const count = formCounts[key];
                    if (!count) return null;
                    const selected = selectedForms.includes(key);
                    // Abbreviate for compact display
                    const tenseShort = tense.slice(0, 4);
                    const voiceShort = voice.slice(0, 3);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleForm(key)}
                        className={`px-2 py-1.5 rounded-lg text-xs transition-colors leading-tight ${
                          selected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                        }`}
                        title={`${tense} ${voice} ${mood} (${count} cards)`}
                      >
                        <span className="font-medium">{tenseShort} {voiceShort}</span>
                        <span className="text-[10px] opacity-60 ml-1">{count}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {selectedForms.length === 0 && (
          <p className="text-xs text-stone-400 mt-1">All forms included (click to filter)</p>
        )}
        {selectedForms.length > 0 && (
          <button
            onClick={() => setSelectedForms([])}
            className="text-xs text-red-400 hover:text-red-300 mt-2"
          >
            Clear selection ({selectedForms.length} forms selected)
          </button>
        )}
      </Section>

      <Section title="Verbs">
        <div className="flex flex-wrap gap-1.5">
          {ALL_VERBS.map(v => (
            <button
              key={v}
              onClick={() => toggleInList(selectedVerbs, setSelectedVerbs, v)}
              className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedVerbs.includes(v)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
              }`}
              style={{ fontFamily: "'Gentium Plus', serif" }}
            >
              {v}
            </button>
          ))}
        </div>
        {selectedVerbs.length === 0 && (
          <p className="text-xs text-stone-400 mt-1">All verbs (click to filter)</p>
        )}
      </Section>
    </>
  );
}
