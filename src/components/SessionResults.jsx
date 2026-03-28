import { getWeaknessAnalysis } from '../utils/storage';

export default function SessionResults({ results, performanceData, onNewSession, onMenu }) {
  const { correct, total, bestStreak } = results;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const analysis = getWeaknessAnalysis(performanceData);

  function getMessage() {
    if (pct === 100) return 'Perfect session!';
    if (pct >= 80) return 'Strong work — keep drilling the ones you missed.';
    if (pct >= 60) return 'Solid foundation — the forms you missed will come back in review.';
    if (pct >= 40) return 'Good effort — focus on the patterns in the explanations.';
    return 'Keep at it — every attempt builds recognition.';
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-6xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          {correct}/{total}
        </div>
        <p className="text-lg text-stone-500 dark:text-stone-400">
          {pct}% first-attempt accuracy
        </p>
        {bestStreak > 1 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Best streak: {bestStreak}
          </p>
        )}
        <p className="mt-4 text-stone-600 dark:text-stone-400">{getMessage()}</p>
      </div>

      {/* Weakness analysis */}
      {(analysis.topCategories.length > 0 || analysis.topLemmas.length > 0) && (
        <div className="bg-stone-100 dark:bg-stone-900 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
            Areas to Watch
          </h3>

          {analysis.topCategories.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                Most common errors by category:
              </p>
              <ul className="space-y-1">
                {analysis.topCategories.map(([cat, count]) => (
                  <li key={cat} className="text-sm text-stone-700 dark:text-stone-300">
                    <span className="font-medium capitalize">{cat.replace('_ptcp', '')}</span>
                    <span className="text-stone-400 ml-1">({count} errors)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.topLemmas.length > 0 && (
            <div>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                Words to review:
              </p>
              <ul className="space-y-1">
                {analysis.topLemmas.map(([lemma, count]) => (
                  <li key={lemma} className="text-sm">
                    <span className="font-medium" style={{ fontFamily: "'Gentium Plus', serif" }}>{lemma}</span>
                    <span className="text-stone-400 ml-1">({count} misses)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Missed cards summary */}
      {results.results && results.results.filter(r => !r.correct || !r.firstAttempt).length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
            Missed Forms
          </h3>
          <div className="space-y-2">
            {results.results
              .filter(r => !r.correct || !r.firstAttempt)
              .map((r, i) => (
                <div key={i} className="bg-stone-100 dark:bg-stone-900 rounded-lg p-3">
                  <span
                    className="font-medium text-stone-900 dark:text-stone-100"
                    style={{ fontFamily: "'Gentium Plus', serif" }}
                  >
                    {r.card.word}
                  </span>
                  <span className="text-stone-400 ml-2 text-sm">{r.card.lemma}</span>
                  <p className="text-xs text-stone-500 mt-1">
                    {r.card.type === 'noun'
                      ? `${r.card.parse.case} ${r.card.parse.number} ${r.card.parse.gender}`
                      : `${r.card.parse.person || ''} ${r.card.parse.tense} ${r.card.parse.voice} ${r.card.parse.mood}`.trim()
                    }
                  </p>
                  {r.wrongCategories.length > 0 && (
                    <p className="text-xs text-red-500 mt-0.5">
                      Wrong: {r.wrongCategories.map(c => c.replace('_ptcp', '')).join(', ')}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={onNewSession}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-medium transition-colors"
        >
          New Session
        </button>
        <button
          onClick={onMenu}
          className="w-full py-3 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-xl font-medium transition-colors"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
