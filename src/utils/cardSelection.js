/**
 * Card selection with adaptive weighting based on performance history.
 */
import { getWeightForCard, getWeakForms, getFormKey } from './storage';

/**
 * Select cards for a session using weighted random selection.
 * Cards the user struggles with appear more often.
 */
export function selectCards(pool, count, performanceData, { random = false } = {}) {
  if (pool.length === 0) return [];
  if (pool.length <= count) return shuffle([...pool]);

  if (random) {
    return shuffle([...pool]).slice(0, count);
  }

  // Weighted selection
  const weighted = pool.map(card => ({
    card,
    weight: getWeightForCard(performanceData, card),
  }));

  const selected = [];
  const usedFormKeys = {};  // formKey -> count
  const usedLemmas = {};    // lemma -> count
  const remaining = [...weighted];

  // How many times a lemma can repeat depends on round size vs pool diversity
  const uniqueLemmas = new Set(pool.map(c => c.lemma)).size;
  const maxPerLemma = Math.max(1, Math.ceil(count / uniqueLemmas));

  while (selected.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, w) => sum + w.weight, 0);
    let rand = Math.random() * totalWeight;

    let chosenIdx = 0;
    for (let i = 0; i < remaining.length; i++) {
      rand -= remaining[i].weight;
      if (rand <= 0) {
        chosenIdx = i;
        break;
      }
    }

    const chosen = remaining[chosenIdx];
    const formKey = getFormKey(chosen.card);
    const lemma = chosen.card.lemma;

    // Don't pick the exact same form (lemma + parse) more than once per session
    if ((usedFormKeys[formKey] || 0) >= 1) {
      remaining.splice(chosenIdx, 1);
      continue;
    }

    // Spread lemmas out — don't drill the same word too many times
    if ((usedLemmas[lemma] || 0) >= maxPerLemma) {
      remaining.splice(chosenIdx, 1);
      continue;
    }

    usedFormKeys[formKey] = (usedFormKeys[formKey] || 0) + 1;
    usedLemmas[lemma] = (usedLemmas[lemma] || 0) + 1;
    selected.push(chosen.card);
    remaining.splice(chosenIdx, 1);
  }

  return shuffle(selected);
}

/**
 * Select cards for weakness drill mode.
 * Only picks from forms the user has struggled with.
 */
export function selectWeaknessCards(allCards, performanceData) {
  const weakForms = getWeakForms(performanceData, 2);
  if (weakForms.length === 0) return [];

  const weakFormKeys = new Set(weakForms.map(w => w.formKey));

  const pool = allCards.filter(card => weakFormKeys.has(getFormKey(card)));

  const count = Math.max(5, Math.min(20, weakForms.length * 2));
  return selectCards(pool, count, performanceData);
}

export function filterNounCards(cards, {
  declension = 'all',
  difficulty = 3,
  selectedNouns = null,
  selectedCases = null,
  selectedGenders = null,
  selectedNumbers = null,
} = {}) {
  return cards.filter(card => {
    if (declension !== 'all' && card.declension !== declension) return false;
    if (card.difficulty > difficulty) return false;
    if (selectedNouns && selectedNouns.length > 0 && !selectedNouns.includes(card.lemma)) return false;
    if (selectedCases && selectedCases.length > 0 && !selectedCases.includes(card.parse.case)) return false;
    if (selectedGenders && selectedGenders.length > 0 && !selectedGenders.includes(card.parse.gender)) return false;
    if (selectedNumbers && selectedNumbers.length > 0 && !selectedNumbers.includes(card.parse.number)) return false;
    return true;
  });
}

export function filterVerbCards(cards, {
  tenseGroup = 'all',
  moodGroup = 'all',
  selectedVerbs = null,
  selectedTenses = null,
  selectedVoices = null,
  selectedMoods = null,
  participleFilter = 'include',
  selectedForms = null,
} = {}) {
  return cards.filter(card => {
    // Form-based filter (tense+voice+mood combos like "Present Active Indicative")
    if (selectedForms && selectedForms.length > 0) {
      const cardForm = `${card.parse.tense} ${card.parse.voice} ${card.parse.mood}`;
      if (!selectedForms.includes(cardForm)) return false;
    } else {
      // Legacy individual filters only apply when no form combos selected
      if (tenseGroup !== 'all' && card.tenseGroup !== tenseGroup) return false;
      if (moodGroup !== 'all' && card.moodGroup !== moodGroup) return false;
      if (selectedTenses && selectedTenses.length > 0 && !selectedTenses.includes(card.parse.tense)) return false;
      if (selectedVoices && selectedVoices.length > 0 && !selectedVoices.includes(card.parse.voice)) return false;
      if (selectedMoods && selectedMoods.length > 0 && !selectedMoods.includes(card.parse.mood)) return false;
      if (participleFilter === 'only' && !card.isParticiple) return false;
      if (participleFilter === 'exclude' && card.isParticiple) return false;
    }
    if (selectedVerbs && selectedVerbs.length > 0 && !selectedVerbs.includes(card.lemma)) return false;
    return true;
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
