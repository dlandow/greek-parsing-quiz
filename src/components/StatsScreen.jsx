import { getWeakForms, getMasteredForms, loadSessionHistory } from '../utils/storage';

export default function StatsScreen({ performanceData, onBack }) {
  const weakForms = getWeakForms(performanceData, 3);
  const masteredForms = getMasteredForms(performanceData);
  const sessions = loadSessionHistory();

  // Overall stats
  let totalAttempts = 0;
  let totalCorrectFirst = 0;
  const categoryAccuracy = {};
  const typeAccuracy = { noun: { correct: 0, total: 0 }, verb: { correct: 0, total: 0 } };

  for (const [formKey, entry] of Object.entries(performanceData)) {
    for (const attempt of entry.attempts) {
      totalAttempts++;
      if (attempt.firstAttempt && attempt.correct) totalCorrectFirst++;

      // Track by card type
      const type = formKey.startsWith('noun') ? 'noun' : 'verb';
      typeAccuracy[type].total++;
      if (attempt.firstAttempt && attempt.correct) typeAccuracy[type].correct++;

      // Track category errors
      if (attempt.wrongCategories) {
        for (const cat of attempt.wrongCategories) {
          if (!categoryAccuracy[cat]) categoryAccuracy[cat] = { wrong: 0, total: 0 };
          categoryAccuracy[cat].wrong++;
          categoryAccuracy[cat].total++;
        }
      }
    }
  }

  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrectFirst / totalAttempts) * 100) : 0;

  function formatFormKey(key) {
    const parts = key.split(':');
    if (parts[0] === 'noun') {
      return `${parts[1]} — ${parts[2]} ${parts[3]} ${parts[4]}`;
    }
    return `${parts[1]} — ${parts.slice(2).filter(Boolean).join(' ')}`;
  }

  if (totalAttempts === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <button onClick={onBack} className="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 mb-6 flex items-center gap-1">
          <span>&larr;</span> Back
        </button>
        <div className="text-center text-stone-500 dark:text-stone-400 py-12">
          <p className="text-lg">No data yet</p>
          <p className="text-sm mt-2">Complete a session to see your stats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={onBack} className="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 mb-6 flex items-center gap-1">
        <span>&larr;</span> Back
      </button>

      <h2 className="text-2xl font-semibold mb-6 text-stone-900 dark:text-stone-100">Stats</h2>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatBox label="Total Cards" value={totalAttempts} />
        <StatBox label="Accuracy" value={`${overallAccuracy}%`} />
        <StatBox label="Mastered" value={masteredForms.length} />
      </div>

      {/* By type */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-stone-100 dark:bg-stone-900 rounded-xl p-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider">Nouns</p>
          <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {typeAccuracy.noun.total > 0 ? Math.round((typeAccuracy.noun.correct / typeAccuracy.noun.total) * 100) : 0}%
          </p>
          <p className="text-xs text-stone-400">{typeAccuracy.noun.total} attempts</p>
        </div>
        <div className="bg-stone-100 dark:bg-stone-900 rounded-xl p-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider">Verbs</p>
          <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {typeAccuracy.verb.total > 0 ? Math.round((typeAccuracy.verb.correct / typeAccuracy.verb.total) * 100) : 0}%
          </p>
          <p className="text-xs text-stone-400">{typeAccuracy.verb.total} attempts</p>
        </div>
      </div>

      {/* Weak points */}
      {weakForms.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
            Weak Points (below 70% accuracy)
          </h3>
          <div className="space-y-2">
            {weakForms.slice(0, 8).map(w => (
              <div key={w.formKey} className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm" style={{ fontFamily: "'Gentium Plus', serif" }}>
                  {formatFormKey(w.formKey)}
                </span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {Math.round(w.accuracy * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mastered forms */}
      {masteredForms.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
            Recently Mastered
          </h3>
          <div className="space-y-2">
            {masteredForms.slice(0, 5).map(m => (
              <div key={m.formKey} className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm" style={{ fontFamily: "'Gentium Plus', serif" }}>
                  {formatFormKey(m.formKey)}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {m.consecutiveCorrect}x correct
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category error rates */}
      {Object.keys(categoryAccuracy).length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
            Error Rates by Category
          </h3>
          <div className="space-y-2">
            {Object.entries(categoryAccuracy)
              .sort((a, b) => b[1].wrong - a[1].wrong)
              .map(([cat, data]) => (
                <div key={cat} className="flex justify-between items-center text-sm">
                  <span className="capitalize text-stone-700 dark:text-stone-300">
                    {cat.replace('_ptcp', '')}
                  </span>
                  <span className="text-stone-500">{data.wrong} errors</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Session history */}
      {sessions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
            Recent Sessions
          </h3>
          <div className="space-y-2">
            {sessions.slice(-10).reverse().map((s, i) => (
              <div key={i} className="bg-stone-100 dark:bg-stone-900 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300 capitalize">
                    {s.mode}
                  </span>
                  <span className="text-xs text-stone-400 ml-2">
                    {s.roundLength} cards
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {s.correct}/{s.total}
                  </span>
                  <span className="text-xs text-stone-400 ml-2">
                    {new Date(s.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-stone-100 dark:bg-stone-900 rounded-xl p-4 text-center">
      <p className="text-xs text-stone-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">{value}</p>
    </div>
  );
}
