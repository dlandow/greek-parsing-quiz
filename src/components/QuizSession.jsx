import { useState, useCallback } from 'react';
import QuizCard from './QuizCard';
import { recordAttempt, loadPerformance } from '../utils/storage';

export default function QuizSession({ cards, config, performanceData, onPerformanceUpdate, onEnd, onQuit, fontSize }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [inReview, setInReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [cardKey, setCardKey] = useState(0); // Force re-mount on card change

  const totalCards = cards.length;
  const currentCard = inReview
    ? reviewQueue[reviewIndex]
    : cards[currentIndex];

  const progress = inReview
    ? `Review ${reviewIndex + 1}/${reviewQueue.length}`
    : `${currentIndex + 1}/${totalCards}`;

  const handleAnswer = useCallback((answer) => {
    // Record in performance data
    const updated = recordAttempt(
      { ...performanceData },
      currentCard,
      answer.correct,
      answer.firstAttempt,
      answer.wrongCategories
    );
    onPerformanceUpdate(updated);

    // Track results
    const newResults = [...results, {
      card: currentCard,
      ...answer,
    }];
    setResults(newResults);

    // Streak
    if (answer.correct && answer.firstAttempt) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
    } else {
      setStreak(0);
    }

    // Add to review queue if wrong on first attempt
    if (!answer.correct && answer.firstAttempt && !inReview) {
      setReviewQueue(prev => [...prev, currentCard]);
    }

    // Advance
    if (inReview) {
      if (reviewIndex + 1 >= reviewQueue.length) {
        // Session complete
        const correct = newResults.filter(r => r.correct && r.firstAttempt).length;
        onEnd({
          correct,
          total: totalCards,
          results: newResults,
          bestStreak: Math.max(bestStreak, answer.correct && answer.firstAttempt ? streak + 1 : 0),
        });
      } else {
        setReviewIndex(prev => prev + 1);
        setCardKey(prev => prev + 1);
      }
    } else {
      if (currentIndex + 1 >= totalCards) {
        // Check if there are cards to review
        const finalReviewQueue = !answer.correct && answer.firstAttempt
          ? [...reviewQueue, currentCard]
          : reviewQueue;

        if (finalReviewQueue.length > 0) {
          setReviewQueue(finalReviewQueue);
          setInReview(true);
          setReviewIndex(0);
          setCardKey(prev => prev + 1);
        } else {
          const correct = newResults.filter(r => r.correct && r.firstAttempt).length;
          onEnd({
            correct,
            total: totalCards,
            results: newResults,
            bestStreak: Math.max(bestStreak, answer.correct && answer.firstAttempt ? streak + 1 : 0),
          });
        }
      } else {
        setCurrentIndex(prev => prev + 1);
        setCardKey(prev => prev + 1);
      }
    }
  }, [currentCard, currentIndex, totalCards, inReview, reviewIndex, reviewQueue, results, streak, bestStreak, performanceData, onPerformanceUpdate, onEnd]);

  if (!currentCard) {
    return <div className="max-w-lg mx-auto px-4 py-12 text-center text-stone-500">No cards available.</div>;
  }

  return (
    <div className="py-6">
      {/* Top bar */}
      <div className="max-w-2xl mx-auto px-4 mb-6 flex items-center justify-between">
        <button
          onClick={onQuit}
          className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          &larr; Quit
        </button>

        <div className="flex items-center gap-4">
          {streak > 1 && (
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {streak} streak
            </span>
          )}
          <span className="text-sm text-stone-500 dark:text-stone-400 font-mono">
            {progress}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <div className="h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              inReview ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{
              width: inReview
                ? `${((reviewIndex) / reviewQueue.length) * 100}%`
                : `${((currentIndex) / totalCards) * 100}%`
            }}
          />
        </div>
        {inReview && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 text-center">
            Review pass — revisiting missed cards
          </p>
        )}
      </div>

      {/* Card */}
      <QuizCard
        key={cardKey}
        card={currentCard}
        focusCategory={config?.focusCategory || 'all'}
        selectedForms={config?.selectedForms || null}
        fontSize={fontSize}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
