/**
 * localStorage wrapper for persisting quiz data across sessions.
 */

const KEYS = {
  PERFORMANCE: 'greek-quiz-performance',
  SESSION_HISTORY: 'greek-quiz-sessions',
  SETTINGS: 'greek-quiz-settings',
};

export function loadPerformance() {
  try {
    const raw = localStorage.getItem(KEYS.PERFORMANCE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePerformance(data) {
  localStorage.setItem(KEYS.PERFORMANCE, JSON.stringify(data));
}

/**
 * Record a single card attempt.
 * performanceData shape: { [formKey]: { attempts: [...], mastery: number } }
 * Each attempt: { correct: bool, firstAttempt: bool, timestamp: number, lemma, categories }
 */
export function recordAttempt(performanceData, card, wasCorrect, wasFirstAttempt, wrongCategories = []) {
  const formKey = getFormKey(card);

  if (!performanceData[formKey]) {
    performanceData[formKey] = { attempts: [], mastery: 0, consecutiveCorrect: 0 };
  }

  const entry = performanceData[formKey];
  entry.attempts.push({
    correct: wasCorrect,
    firstAttempt: wasFirstAttempt,
    timestamp: Date.now(),
    lemma: card.lemma,
    wrongCategories,
    cardType: card.type,
  });

  // Update consecutive correct count (first attempt only)
  if (wasFirstAttempt && wasCorrect) {
    entry.consecutiveCorrect = (entry.consecutiveCorrect || 0) + 1;
  } else if (!wasCorrect) {
    entry.consecutiveCorrect = 0;
  }

  // Mastery: 3+ consecutive first-attempt correct across sessions
  entry.mastery = entry.consecutiveCorrect >= 3 ? 1 : 0;

  savePerformance(performanceData);
  return performanceData;
}

export function getFormKey(card) {
  if (card.type === 'noun') {
    return `noun:${card.lemma}:${card.parse.case}:${card.parse.number}:${card.parse.gender}`;
  }
  return `verb:${card.lemma}:${card.parse.person || ''}:${card.parse.tense}:${card.parse.voice}:${card.parse.mood}`;
}

export function getWeightForCard(performanceData, card) {
  const formKey = getFormKey(card);
  const entry = performanceData[formKey];

  if (!entry || entry.attempts.length === 0) {
    return 1.0; // Never seen — medium priority
  }

  // Mastered forms get low weight
  if (entry.mastery === 1) {
    // Check if due for maintenance review (every ~5 sessions)
    const lastAttempt = entry.attempts[entry.attempts.length - 1];
    const daysSince = (Date.now() - lastAttempt.timestamp) / (1000 * 60 * 60 * 24);
    return daysSince > 7 ? 0.3 : 0.1;
  }

  // Calculate recent accuracy (last 5 attempts)
  const recent = entry.attempts.slice(-5);
  const recentAccuracy = recent.filter(a => a.firstAttempt && a.correct).length / recent.length;

  // Lower accuracy = higher weight
  if (recentAccuracy <= 0.2) return 3.0;
  if (recentAccuracy <= 0.4) return 2.5;
  if (recentAccuracy <= 0.6) return 2.0;
  if (recentAccuracy <= 0.8) return 1.5;
  return 0.8;
}

export function loadSessionHistory() {
  try {
    const raw = localStorage.getItem(KEYS.SESSION_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session) {
  const history = loadSessionHistory();
  history.push({
    ...session,
    timestamp: Date.now(),
  });
  // Keep last 50 sessions
  if (history.length > 50) history.splice(0, history.length - 50);
  localStorage.setItem(KEYS.SESSION_HISTORY, JSON.stringify(history));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export function getWeakForms(performanceData, minAttempts = 3) {
  const weak = [];
  for (const [formKey, entry] of Object.entries(performanceData)) {
    if (entry.attempts.length < minAttempts) continue;
    const recent = entry.attempts.slice(-5);
    const accuracy = recent.filter(a => a.firstAttempt && a.correct).length / recent.length;
    if (accuracy < 0.7) {
      weak.push({ formKey, accuracy, attempts: entry.attempts.length, entry });
    }
  }
  return weak.sort((a, b) => a.accuracy - b.accuracy);
}

export function getMasteredForms(performanceData) {
  return Object.entries(performanceData)
    .filter(([, entry]) => entry.mastery === 1)
    .map(([formKey, entry]) => ({
      formKey,
      consecutiveCorrect: entry.consecutiveCorrect,
      lastAttempt: entry.attempts[entry.attempts.length - 1]?.timestamp,
    }));
}

export function getWeaknessAnalysis(performanceData) {
  const categoryErrors = {};
  const lemmaErrors = {};
  const declensionErrors = {};

  for (const [formKey, entry] of Object.entries(performanceData)) {
    const recent = entry.attempts.slice(-10);
    for (const attempt of recent) {
      if (!attempt.correct && attempt.wrongCategories) {
        for (const cat of attempt.wrongCategories) {
          categoryErrors[cat] = (categoryErrors[cat] || 0) + 1;
        }
      }
      if (!attempt.firstAttempt || !attempt.correct) {
        lemmaErrors[attempt.lemma] = (lemmaErrors[attempt.lemma] || 0) + 1;
      }
    }

    // Parse formKey for declension/conjugation info
    const parts = formKey.split(':');
    const type = parts[0];
    if (type === 'noun' && entry.attempts.some(a => !a.correct)) {
      const errorCount = entry.attempts.filter(a => !a.correct).length;
      const group = formKey; // Use full key for now
      declensionErrors[group] = (declensionErrors[group] || 0) + errorCount;
    }
  }

  // Top 3 category errors
  const topCategories = Object.entries(categoryErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Top 3 lemma errors
  const topLemmas = Object.entries(lemmaErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return { topCategories, topLemmas };
}
