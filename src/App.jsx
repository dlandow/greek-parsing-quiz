import { useState, useEffect } from 'react';
import cardData from './data/cards.json';
import SetupScreen from './components/SetupScreen';
import QuizSession from './components/QuizSession';
import SessionResults from './components/SessionResults';
import StatsScreen from './components/StatsScreen';
import ParadigmReference from './components/ParadigmReference';
import ParadigmPractice from './components/ParadigmPractice';
import { loadPerformance, loadSettings, saveSettings, saveSession } from './utils/storage';
import { selectCards, selectWeaknessCards, filterNounCards, filterVerbCards } from './utils/cardSelection';

function App() {
  const [screen, setScreen] = useState('menu');
  const [sessionCards, setSessionCards] = useState([]);
  const [sessionConfig, setSessionConfig] = useState(null);
  const [sessionResults, setSessionResults] = useState(null);
  const [performanceData, setPerformanceData] = useState(() => loadPerformance());
  const [fontSize, setFontSize] = useState(() => {
    try {
      return parseInt(localStorage.getItem('greek-quiz-fontsize')) || 24;
    } catch { return 24; }
  });

  useEffect(() => {
    localStorage.setItem('greek-quiz-fontsize', fontSize.toString());
  }, [fontSize]);

  function handleStartSession(config) {
    setSessionConfig(config);

    let pool = [];

    if (config.mode === 'weakness') {
      const allCards = [...cardData.nouns, ...cardData.verbs];
      pool = selectWeaknessCards(allCards, performanceData);
      if (pool.length === 0) {
        pool = selectCards(allCards, config.roundLength || 10, performanceData, { random: true });
      }
      const cards = pool.length > 0 ? pool : [];
      setSessionCards(cards);
      setScreen('quiz');
      return;
    }

    if (config.mode === 'nouns' || config.mode === 'both') {
      const filtered = filterNounCards(cardData.nouns, {
        declension: config.declension,
        difficulty: config.difficulty,
        selectedNouns: config.selectedNouns,
        selectedCases: config.selectedCases,
        selectedGenders: config.selectedGenders,
        selectedNumbers: config.selectedNumbers,
      });
      pool.push(...filtered);
    }

    if (config.mode === 'verbs' || config.mode === 'both') {
      const filtered = filterVerbCards(cardData.verbs, {
        selectedVerbs: config.selectedVerbs,
        selectedForms: config.selectedForms,
      });
      pool.push(...filtered);
    }

    const cards = selectCards(pool, config.roundLength || 10, performanceData, {
      random: config.random || false,
    });

    setSessionCards(cards);
    setSessionConfig(config);
    setScreen('quiz');
  }

  function handleSessionEnd(results) {
    setSessionResults(results);
    saveSession({
      mode: sessionConfig?.mode || 'mixed',
      roundLength: sessionCards.length,
      correct: results.correct,
      total: results.total,
      streak: results.bestStreak,
    });
    setPerformanceData(loadPerformance());
    setScreen('results');
  }

  function handlePerformanceUpdate(newData) {
    setPerformanceData(newData);
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 transition-colors">
      {screen === 'menu' && (
        <MainMenu
          onStart={() => setScreen('setup')}
          onStats={() => setScreen('stats')}
          onParadigms={() => setScreen('paradigms')}
          onParadigmPractice={() => setScreen('paradigm-practice')}
          onWeakness={() => handleStartSession({ mode: 'weakness', roundLength: 15 })}
          fontSize={fontSize}
          setFontSize={setFontSize}
          hasWeakForms={Object.keys(performanceData).length > 0}
        />
      )}
      {screen === 'setup' && (
        <SetupScreen
          cardData={cardData}
          onStart={handleStartSession}
          onBack={() => setScreen('menu')}
          savedSettings={loadSettings()}
          onSaveSettings={saveSettings}
        />
      )}
      {screen === 'quiz' && (
        <QuizSession
          cards={sessionCards}
          config={sessionConfig}
          performanceData={performanceData}
          onPerformanceUpdate={handlePerformanceUpdate}
          onEnd={handleSessionEnd}
          onQuit={() => setScreen('menu')}
          fontSize={fontSize}
        />
      )}
      {screen === 'results' && (
        <SessionResults
          results={sessionResults}
          performanceData={performanceData}
          onNewSession={() => setScreen('setup')}
          onMenu={() => setScreen('menu')}
        />
      )}
      {screen === 'stats' && (
        <StatsScreen
          performanceData={performanceData}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'paradigms' && (
        <ParadigmReference onBack={() => setScreen('menu')} />
      )}
      {screen === 'paradigm-practice' && (
        <ParadigmPractice onBack={() => setScreen('menu')} />
      )}
    </div>
  );
}

function MainMenu({ onStart, onStats, onParadigms, onParadigmPractice, onWeakness, fontSize, setFontSize, hasWeakForms }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Greek Parsing
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-lg">
          Koine Greek morphology drill
        </p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <button
          onClick={onStart}
          className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-medium transition-colors"
        >
          New Session
        </button>

        {hasWeakForms && (
          <button
            onClick={onWeakness}
            className="w-full py-4 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-lg font-medium transition-colors"
          >
            Drill Weaknesses
          </button>
        )}

        <button
          onClick={onParadigmPractice}
          className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-lg font-medium transition-colors"
        >
          Practice Paradigms
        </button>

        <button
          onClick={onParadigms}
          className="w-full py-3 px-6 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-xl text-lg font-medium transition-colors"
        >
          Paradigm Tables
        </button>

        <button
          onClick={onStats}
          className="w-full py-3 px-6 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-xl text-lg font-medium transition-colors"
        >
          Stats
        </button>
      </div>

      <div className="w-full mt-4">
        <label className="block text-sm text-stone-500 dark:text-stone-400 mb-2">
          Greek text size: {fontSize}px
        </label>
        <input
          type="range"
          min="18"
          max="40"
          value={fontSize}
          onChange={e => setFontSize(parseInt(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <p className="mt-2 text-center" style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: `${fontSize}px` }}>
          Ἐν ἀρχῇ ἦν ὁ λόγος
        </p>
      </div>

      <p className="text-xs text-stone-400 dark:text-stone-500 mt-8">
        Data from MorphGNT/SBLGNT — {cardData.meta.nounCount} noun cards, {cardData.meta.verbCount} verb cards
      </p>
    </div>
  );
}

export default App;
