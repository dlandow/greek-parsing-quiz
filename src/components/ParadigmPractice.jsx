import { useState, useEffect, useCallback, useRef } from 'react';
import { NOUN_PARADIGMS, VERB_PARADIGMS, ARTICLE_PARADIGM } from '../utils/paradigms';

// ─── Mode selector ──────────────────────────────────────────
const MODES = [
  { id: 'scramble', label: 'Drag & Drop', desc: 'Scramble a paradigm and reassemble it' },
  { id: 'fill', label: 'Fill the Blanks', desc: 'Fill in missing endings from a word bank' },
  { id: 'match', label: 'Match Endings', desc: 'Match each ending to its form' },
  { id: 'speed', label: 'Speed Round', desc: 'Name the ending for a given form — no table' },
];

export default function ParadigmPractice({ onBack }) {
  const [selectedParadigm, setSelectedParadigm] = useState(null);
  const [mode, setMode] = useState(null);
  const [tab, setTab] = useState('noun'); // noun or verb

  if (!selectedParadigm || !mode) {
    return (
      <ParadigmSelector
        tab={tab}
        setTab={setTab}
        selectedParadigm={selectedParadigm}
        setSelectedParadigm={setSelectedParadigm}
        mode={mode}
        setMode={setMode}
        onBack={onBack}
      />
    );
  }

  const handleBack = () => {
    setSelectedParadigm(null);
    setMode(null);
  };

  switch (mode) {
    case 'scramble':
      return <ScrambleMode paradigm={selectedParadigm} onBack={handleBack} />;
    case 'fill':
      return <FillMode paradigm={selectedParadigm} onBack={handleBack} />;
    case 'match':
      return <MatchMode paradigm={selectedParadigm} onBack={handleBack} />;
    case 'speed':
      return <SpeedMode paradigm={selectedParadigm} onBack={handleBack} />;
    default:
      return null;
  }
}

// ─── Setup screen ──────────────────────────────────────────
function ParadigmSelector({ tab, setTab, selectedParadigm, setSelectedParadigm, mode, setMode, onBack }) {
  const paradigms = tab === 'noun' ? [ARTICLE_PARADIGM, ...NOUN_PARADIGMS] : VERB_PARADIGMS;
  const canStart = selectedParadigm && mode;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={onBack} className="text-stone-500 hover:text-stone-300 mb-4 text-sm">
        ← Back
      </button>
      <h1 className="text-2xl font-semibold mb-6">Paradigm Practice</h1>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        {['noun', 'verb'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedParadigm(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-indigo-600 text-white'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            {t === 'noun' ? 'Nouns' : 'Verbs'}
          </button>
        ))}
      </div>

      {/* Paradigm selection */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">
          Choose a paradigm
        </h2>
        <div className="flex flex-col gap-2">
          {paradigms.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedParadigm(p)}
              className={`text-left px-4 py-3 rounded-lg transition-colors ${
                selectedParadigm?.id === p.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <div className="font-medium text-sm">{p.title}</div>
              <div className={`text-xs mt-0.5 ${
                selectedParadigm?.id === p.id ? 'text-indigo-200' : 'text-stone-500'
              }`}>
                {p.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode selection */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">
          Practice mode
        </h2>
        <div className="flex flex-col gap-2">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`text-left px-4 py-3 rounded-lg transition-colors ${
                mode === m.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <div className="font-medium text-sm">{m.label}</div>
              <div className={`text-xs mt-0.5 ${
                mode === m.id ? 'text-indigo-200' : 'text-stone-500'
              }`}>
                {m.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={() => {}} // Will auto-navigate since both are set
        disabled={!canStart}
        className={`w-full py-4 rounded-xl text-lg font-medium transition-colors ${
          canStart
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
        }`}
      >
        {canStart ? 'Start' : 'Select a paradigm and mode'}
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────
function getEndings(paradigm) {
  // Extract all non-header, non-label cells as endings
  const endings = [];
  paradigm.rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      if (ci === 0) return; // row label
      endings.push({
        text: cell,
        row: ri,
        col: ci,
        label: `${row[0]} ${paradigm.headers[ci] || ''}`.trim(),
      });
    });
  });
  return endings;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PeekParadigm({ paradigm }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      <button
        onClick={() => setShow(!show)}
        className={`text-sm px-4 py-1.5 rounded-lg border transition-colors ${
          show
            ? 'bg-indigo-600 border-indigo-500 text-white'
            : 'bg-stone-800 border-stone-600 text-stone-400 border-dashed hover:border-stone-400'
        }`}
      >
        {show ? 'Hide Paradigm' : 'Peek at Paradigm'}
      </button>
      {show && (
        <div className="mt-3 bg-stone-900 border border-stone-700 rounded-lg p-4 overflow-x-auto">
          <div className="text-sm text-stone-400 mb-2 font-medium">{paradigm.title}</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {paradigm.headers.map((h, i) => (
                  <th key={i} className="text-xs text-stone-400 uppercase tracking-wide px-2 py-1 text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paradigm.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-2 py-1.5 text-center ${ci === 0 ? 'text-sm text-stone-400 font-medium text-left' : ''}`}
                      style={ci > 0 ? { fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: '16px' } : {}}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {paradigm.note && (
            <p className="text-xs text-stone-500 mt-2 italic">{paradigm.note}</p>
          )}
        </div>
      )}
    </div>
  );
}

function GreekCell({ children, highlight, correct, wrong, onClick, draggable, onDragStart, onDragOver, onDrop, style }) {
  let bg = 'bg-stone-800';
  if (highlight) bg = 'bg-indigo-900/50 border-indigo-500';
  if (correct) bg = 'bg-emerald-900/50 border-emerald-500';
  if (wrong) bg = 'bg-red-900/50 border-red-500';

  return (
    <div
      className={`${bg} border border-stone-700 rounded px-3 py-2 text-center font-serif cursor-pointer select-none transition-colors`}
      style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: '18px', ...style }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
}

function ResultBanner({ correct, total, onRetry, onBack }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const msg = pct === 100 ? 'Perfect!' : pct >= 80 ? 'Great work!' : pct >= 60 ? 'Getting there!' : 'Keep practicing!';

  return (
    <div className="bg-stone-800 rounded-xl p-6 text-center mb-6">
      <div className="text-3xl font-semibold mb-1">{correct}/{total}</div>
      <div className="text-stone-400 mb-1">{pct}% correct</div>
      <div className="text-lg mb-4">{msg}</div>
      <div className="flex gap-3 justify-center">
        <button onClick={onRetry} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
          Try Again
        </button>
        <button onClick={onBack} className="px-6 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg transition-colors">
          Back
        </button>
      </div>
    </div>
  );
}

// ─── SCRAMBLE MODE ──────────────────────────────────────────
// Drag and drop endings into the correct cells
function ScrambleMode({ paradigm, onBack }) {
  const endings = getEndings(paradigm);
  const [scrambled, setScrambled] = useState(() => shuffle(endings));
  const [placed, setPlaced] = useState(() => {
    // Initialize empty grid
    const grid = {};
    endings.forEach(e => { grid[`${e.row}-${e.col}`] = null; });
    return grid;
  });
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState(null);
  const [dragItem, setDragItem] = useState(null);

  function handleDragStart(item, source) {
    setDragItem({ item, source });
  }

  function handleDropOnCell(row, col) {
    if (!dragItem || checked) return;
    const key = `${row}-${col}`;

    setPlaced(prev => {
      const next = { ...prev };
      // If cell already has something, put it back in scrambled
      const existing = next[key];

      // If dragging from another cell, clear that cell
      if (dragItem.source?.type === 'cell') {
        next[dragItem.source.key] = null;
      }

      next[key] = dragItem.item;

      // Put existing back in bank if needed
      if (existing && dragItem.source?.type === 'bank') {
        setScrambled(prev => [...prev, existing]);
      } else if (existing && dragItem.source?.type === 'cell') {
        next[dragItem.source.key] = existing;
      }

      return next;
    });

    // Remove from bank if dragged from bank
    if (dragItem.source?.type === 'bank') {
      setScrambled(prev => prev.filter(e => e !== dragItem.item));
    }

    setDragItem(null);
  }

  function handleDropOnBank() {
    if (!dragItem || checked) return;
    if (dragItem.source?.type === 'cell') {
      setPlaced(prev => ({ ...prev, [dragItem.source.key]: null }));
      setScrambled(prev => [...prev, dragItem.item]);
    }
    setDragItem(null);
  }

  function handleCheck() {
    let correct = 0;
    const total = endings.length;
    endings.forEach(e => {
      const key = `${e.row}-${e.col}`;
      if (placed[key] && placed[key].text === e.text && placed[key].row === e.row && placed[key].col === e.col) {
        correct++;
      }
    });
    setResults({ correct, total });
    setChecked(true);
  }

  function handleRetry() {
    setScrambled(shuffle(endings));
    setPlaced(() => {
      const grid = {};
      endings.forEach(e => { grid[`${e.row}-${e.col}`] = null; });
      return grid;
    });
    setChecked(false);
    setResults(null);
  }

  const allPlaced = Object.values(placed).every(v => v !== null);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={onBack} className="text-stone-500 hover:text-stone-300 mb-4 text-sm">
        ← Back
      </button>
      <h1 className="text-xl font-semibold mb-1">{paradigm.title}</h1>
      <p className="text-sm text-stone-400 mb-4">Drag endings into the correct cells</p>
      <PeekParadigm paradigm={paradigm} />

      {results && <ResultBanner {...results} onRetry={handleRetry} onBack={onBack} />}

      {/* Table grid */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {paradigm.headers.map((h, i) => (
                <th key={i} className="text-xs text-stone-400 uppercase tracking-wide px-2 py-2 text-center">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paradigm.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  if (ci === 0) {
                    return (
                      <td key={ci} className="text-sm text-stone-400 px-2 py-2 font-medium">
                        {cell}
                      </td>
                    );
                  }
                  const key = `${ri}-${ci}`;
                  const placedItem = placed[key];
                  const isCorrect = checked && placedItem && placedItem.row === ri && placedItem.col === ci;
                  const isWrong = checked && placedItem && (placedItem.row !== ri || placedItem.col !== ci);
                  const isEmpty = !placedItem;

                  return (
                    <td key={ci} className="px-1 py-1">
                      <div
                        className={`border-2 border-dashed rounded px-3 py-2 text-center min-h-[40px] flex items-center justify-center transition-colors cursor-pointer ${
                          isCorrect ? 'border-emerald-500 bg-emerald-900/30' :
                          isWrong ? 'border-red-500 bg-red-900/30' :
                          isEmpty ? 'border-stone-600 bg-stone-900/30' :
                          'border-indigo-500 bg-indigo-900/20'
                        }`}
                        style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: '17px' }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); handleDropOnCell(ri, ci); }}
                        onClick={() => {
                          if (checked) return;
                          if (placedItem) {
                            // Click to remove from cell back to bank
                            setPlaced(prev => ({ ...prev, [key]: null }));
                            setScrambled(prev => [...prev, placedItem]);
                          }
                        }}
                      >
                        {placedItem ? placedItem.text : ''}
                        {checked && isWrong && (
                          <span className="block text-xs text-emerald-400 mt-1">
                            {endings.find(e => e.row === ri && e.col === ci)?.text}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Word bank */}
      {!checked && (
        <div
          className="mb-6"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleDropOnBank(); }}
        >
          <h3 className="text-xs text-stone-400 uppercase tracking-wide mb-2">Endings</h3>
          <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-stone-900/50 rounded-lg border border-stone-700">
            {scrambled.map((item, i) => (
              <div
                key={`${item.text}-${item.row}-${item.col}-${i}`}
                draggable
                onDragStart={() => handleDragStart(item, { type: 'bank' })}
                onClick={() => {
                  // Click to place in first empty cell (top-to-bottom, then left-to-right)
                  const numRows = paradigm.rows.length;
                  const numCols = paradigm.headers.length;
                  let emptyKey = null;
                  for (let ci = 1; ci < numCols && !emptyKey; ci++) {
                    for (let ri = 0; ri < numRows && !emptyKey; ri++) {
                      const k = `${ri}-${ci}`;
                      if (placed[k] === null) emptyKey = k;
                    }
                  }
                  if (emptyKey) {
                    setPlaced(prev => ({ ...prev, [emptyKey]: item }));
                    setScrambled(prev => prev.filter((_, idx) => idx !== i));
                  }
                }}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded cursor-grab active:cursor-grabbing select-none transition-colors"
                style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: '17px' }}
              >
                {item.text}
              </div>
            ))}
            {scrambled.length === 0 && (
              <span className="text-stone-500 text-sm italic">All endings placed</span>
            )}
          </div>
        </div>
      )}

      {/* Check / actions */}
      {!checked && (
        <button
          onClick={handleCheck}
          disabled={!allPlaced}
          className={`w-full py-3 rounded-xl text-lg font-medium transition-colors ${
            allPlaced
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-stone-800 text-stone-500 cursor-not-allowed'
          }`}
        >
          Check
        </button>
      )}
    </div>
  );
}

// ─── FILL-IN-THE-BLANK MODE ──────────────────────────────────
// Show paradigm with some cells blanked, pick from word bank
function FillMode({ paradigm, onBack }) {
  const endings = getEndings(paradigm);
  const [difficulty, setDifficulty] = useState(0.4); // fraction of cells to blank
  const [blanked, setBlanked] = useState(null);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null); // selected bank item

  // Initialize blanked cells
  useEffect(() => {
    startRound();
  }, [difficulty]);

  function startRound() {
    const count = Math.max(2, Math.round(endings.length * difficulty));
    const indices = shuffle([...Array(endings.length).keys()]).slice(0, count);
    setBlanked(new Set(indices));
    setAnswers({});
    setChecked(false);
    setResults(null);
    setSelected(null);
  }

  if (!blanked) return null;

  const blankedEndings = endings.filter((_, i) => blanked.has(i));
  const bankItems = shuffle(blankedEndings);
  const usedAnswers = new Set(Object.values(answers).map(a => `${a.row}-${a.col}`));

  function handleCellClick(endingIdx) {
    if (checked) return;
    if (!blanked.has(endingIdx)) return;

    const key = endingIdx.toString();

    if (answers[key]) {
      // Remove answer
      setAnswers(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    if (selected !== null) {
      setAnswers(prev => ({ ...prev, [key]: selected }));
      setSelected(null);
    }
  }

  function handleCheck() {
    let correct = 0;
    blanked.forEach(idx => {
      const answer = answers[idx.toString()];
      if (answer && answer.text === endings[idx].text) {
        correct++;
      }
    });
    setResults({ correct, total: blanked.size });
    setChecked(true);
  }

  const allFilled = blanked.size === Object.keys(answers).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={onBack} className="text-stone-500 hover:text-stone-300 mb-4 text-sm">
        ← Back
      </button>
      <h1 className="text-xl font-semibold mb-1">{paradigm.title}</h1>
      <p className="text-sm text-stone-400 mb-2">Fill in the missing endings</p>
      <PeekParadigm paradigm={paradigm} />

      {/* Difficulty slider */}
      {!checked && (
        <div className="mb-4">
          <label className="text-xs text-stone-400">
            Blanks: {Math.round(difficulty * 100)}% ({Math.max(2, Math.round(endings.length * difficulty))} of {endings.length})
          </label>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.1"
            value={difficulty}
            onChange={e => setDifficulty(parseFloat(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>
      )}

      {results && <ResultBanner {...results} onRetry={startRound} onBack={onBack} />}

      {/* Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {paradigm.headers.map((h, i) => (
                <th key={i} className="text-xs text-stone-400 uppercase tracking-wide px-2 py-2 text-center">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paradigm.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  if (ci === 0) {
                    return (
                      <td key={ci} className="text-sm text-stone-400 px-2 py-2 font-medium">
                        {cell}
                      </td>
                    );
                  }
                  const endingIdx = endings.findIndex(e => e.row === ri && e.col === ci);
                  const isBlanked = blanked.has(endingIdx);
                  const answer = answers[endingIdx?.toString()];
                  const isCorrect = checked && answer && answer.text === cell;
                  const isWrong = checked && answer && answer.text !== cell;
                  const isMissing = checked && isBlanked && !answer;

                  if (!isBlanked) {
                    return (
                      <td key={ci} className="px-1 py-1">
                        <div
                          className="bg-stone-800 rounded px-3 py-2 text-center"
                          style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: '17px' }}
                        >
                          {cell}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={ci} className="px-1 py-1">
                      <div
                        onClick={() => handleCellClick(endingIdx)}
                        className={`border-2 border-dashed rounded px-3 py-2 text-center min-h-[40px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
                          isCorrect ? 'border-emerald-500 bg-emerald-900/30' :
                          isWrong ? 'border-red-500 bg-red-900/30' :
                          isMissing ? 'border-red-500 bg-red-900/30' :
                          answer ? 'border-indigo-500 bg-indigo-900/20' :
                          'border-stone-600 bg-stone-900/30'
                        }`}
                        style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: '17px' }}
                      >
                        {answer ? answer.text : (selected ? '?' : '')}
                        {(isWrong || isMissing) && (
                          <span className="block text-xs text-emerald-400 mt-0.5">{cell}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Word bank */}
      {!checked && (
        <div className="mb-6">
          <h3 className="text-xs text-stone-400 uppercase tracking-wide mb-2">Word bank</h3>
          <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-stone-900/50 rounded-lg border border-stone-700">
            {bankItems.map((item, i) => {
              const isUsed = Object.values(answers).some(a => a.row === item.row && a.col === item.col);
              const isSelected = selected?.row === item.row && selected?.col === item.col;
              if (isUsed) return null;
              return (
                <div
                  key={`${item.text}-${item.row}-${item.col}`}
                  onClick={() => setSelected(isSelected ? null : item)}
                  className={`px-3 py-1.5 rounded cursor-pointer select-none transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-stone-700 hover:bg-stone-600'
                  }`}
                  style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: '17px' }}
                >
                  {item.text}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!checked && (
        <button
          onClick={handleCheck}
          disabled={!allFilled}
          className={`w-full py-3 rounded-xl text-lg font-medium transition-colors ${
            allFilled
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-stone-800 text-stone-500 cursor-not-allowed'
          }`}
        >
          Check
        </button>
      )}
    </div>
  );
}

// ─── MATCH MODE ──────────────────────────────────────────
// Show endings on the left, forms on the right — instant feedback per match
function MatchMode({ paradigm, onBack }) {
  const endings = getEndings(paradigm);

  const [items, setItems] = useState(() => ({
    endings: shuffle([...endings]),
    labels: shuffle([...endings]),
  }));
  const [selectedEnding, setSelectedEnding] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(null);
  // Track state per ending index: null (unmatched), 'correct', 'wrong'
  const [endingState, setEndingState] = useState({});
  // Track which label indices are locked (matched correctly)
  const [lockedLabels, setLockedLabels] = useState(new Set());
  const [lockedEndings, setLockedEndings] = useState(new Set());
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [flashWrong, setFlashWrong] = useState(null); // { ending, label } indices for wrong flash
  const [done, setDone] = useState(false);

  function tryMatch(eIdx, lIdx) {
    const ending = items.endings[eIdx];
    const label = items.labels[lIdx];
    const isCorrect = ending.row === label.row && ending.col === label.col;

    setAttempts(prev => prev + 1);

    if (isCorrect) {
      setCorrect(prev => prev + 1);
      setEndingState(prev => ({ ...prev, [eIdx]: 'correct' }));
      setLockedLabels(prev => new Set([...prev, lIdx]));
      setLockedEndings(prev => new Set([...prev, eIdx]));
      setSelectedEnding(null);
      setSelectedLabel(null);

      // Check if done
      if (lockedEndings.size + 1 === endings.length) {
        setDone(true);
      }
    } else {
      // Flash wrong briefly, then reset selection
      setFlashWrong({ ending: eIdx, label: lIdx });
      setSelectedEnding(null);
      setSelectedLabel(null);
      setTimeout(() => setFlashWrong(null), 800);
    }
  }

  function handleEndingClick(idx) {
    if (lockedEndings.has(idx) || done) return;
    if (flashWrong) return; // wait for flash to clear

    if (selectedEnding === idx) {
      setSelectedEnding(null);
      return;
    }
    setSelectedEnding(idx);
    if (selectedLabel !== null) {
      tryMatch(idx, selectedLabel);
    }
  }

  function handleLabelClick(idx) {
    if (lockedLabels.has(idx) || done) return;
    if (flashWrong) return;

    if (selectedLabel === idx) {
      setSelectedLabel(null);
      return;
    }
    setSelectedLabel(idx);
    if (selectedEnding !== null) {
      tryMatch(selectedEnding, idx);
    }
  }

  function handleRetry() {
    setItems({
      endings: shuffle([...endings]),
      labels: shuffle([...endings]),
    });
    setSelectedEnding(null);
    setSelectedLabel(null);
    setEndingState({});
    setLockedLabels(new Set());
    setLockedEndings(new Set());
    setCorrect(0);
    setAttempts(0);
    setFlashWrong(null);
    setDone(false);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={onBack} className="text-stone-500 hover:text-stone-300 mb-4 text-sm">
        ← Back
      </button>
      <h1 className="text-xl font-semibold mb-1">{paradigm.title}</h1>
      <p className="text-sm text-stone-400 mb-2">Tap one from each column to match</p>
      <PeekParadigm paradigm={paradigm} />

      {/* Score */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-stone-400">
          {lockedEndings.size} / {endings.length} matched
        </span>
        {attempts > 0 && (
          <span className="text-sm text-stone-400">
            {correct}/{attempts} attempts correct
          </span>
        )}
      </div>

      {done && (
        <ResultBanner correct={correct} total={attempts} onRetry={handleRetry} onBack={onBack} />
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Endings column */}
        <div>
          <h3 className="text-xs text-stone-400 uppercase tracking-wide mb-2 text-center">Ending</h3>
          <div className="flex flex-col gap-2">
            {items.endings.map((item, i) => {
              const isLocked = lockedEndings.has(i);
              const isSelected = selectedEnding === i;
              const isFlashWrong = flashWrong?.ending === i;

              return (
                <div
                  key={`e-${i}`}
                  onClick={() => handleEndingClick(i)}
                  className={`px-3 py-2 rounded text-center cursor-pointer select-none transition-all duration-200 ${
                    isLocked ? 'bg-emerald-900/40 border border-emerald-600 text-emerald-300' :
                    isFlashWrong ? 'bg-red-900/50 border border-red-500 animate-pulse' :
                    isSelected ? 'bg-indigo-600 text-white border border-indigo-400' :
                    'bg-stone-800 hover:bg-stone-700 border border-stone-700'
                  }`}
                  style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: '17px' }}
                >
                  {item.text}
                  {isLocked && (
                    <span className="block text-xs text-emerald-400 mt-0.5">{item.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Labels column */}
        <div>
          <h3 className="text-xs text-stone-400 uppercase tracking-wide mb-2 text-center">Form</h3>
          <div className="flex flex-col gap-2">
            {items.labels.map((item, i) => {
              const isLocked = lockedLabels.has(i);
              const isSelected = selectedLabel === i;
              const isFlashWrong = flashWrong?.label === i;

              return (
                <div
                  key={`l-${i}`}
                  onClick={() => handleLabelClick(i)}
                  className={`px-3 py-2 rounded text-center text-sm cursor-pointer select-none transition-all duration-200 ${
                    isLocked ? 'bg-emerald-900/40 border border-emerald-600 text-emerald-300' :
                    isFlashWrong ? 'bg-red-900/50 border border-red-500 animate-pulse' :
                    isSelected ? 'bg-indigo-600 text-white border border-indigo-400' :
                    'bg-stone-800 hover:bg-stone-700 border border-stone-700'
                  }`}
                >
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SPEED MODE ──────────────────────────────────────────
// Flash a form label, pick the correct ending from options
function SpeedMode({ paradigm, onBack }) {
  const endings = getEndings(paradigm);
  const [queue, setQueue] = useState(() => shuffle([...endings]));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const current = queue[currentIdx];

  // Generate options for current question
  useEffect(() => {
    if (!current || done) return;
    const correctAnswer = current.text;
    const distractors = shuffle(
      endings.filter(e => e.text !== correctAnswer).map(e => e.text)
    );
    const uniqueDistractors = [...new Set(distractors)].slice(0, 3);
    const opts = shuffle([correctAnswer, ...uniqueDistractors]);
    setOptions(opts);
    setSelected(null);
    setShowResult(false);
  }, [currentIdx, done]);

  function handleSelect(option) {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    setTotal(prev => prev + 1);
    if (option === current.text) {
      setCorrect(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentIdx + 1 >= queue.length) {
        setDone(true);
      } else {
        setCurrentIdx(prev => prev + 1);
      }
    }, option === current.text ? 600 : 1500);
  }

  function handleRetry() {
    setQueue(shuffle([...endings]));
    setCurrentIdx(0);
    setCorrect(0);
    setTotal(0);
    setStreak(0);
    setDone(false);
    setShowResult(false);
    setSelected(null);
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">{paradigm.title} — Speed Round</h1>
        <ResultBanner correct={correct} total={total} onRetry={handleRetry} onBack={onBack} />
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={onBack} className="text-stone-500 hover:text-stone-300 mb-4 text-sm">
        ← Back
      </button>

      {/* Progress */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-stone-400">{currentIdx + 1} / {queue.length}</span>
        {streak > 1 && (
          <span className="text-sm text-amber-400">🔥 {streak}</span>
        )}
      </div>
      <div className="w-full bg-stone-800 rounded-full h-1.5 mb-8">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIdx + 1) / queue.length) * 100}%` }}
        />
      </div>

      <PeekParadigm paradigm={paradigm} />

      {/* Question */}
      <div className="text-center mb-8">
        <p className="text-sm text-stone-400 mb-3">What is the ending for:</p>
        <div className="text-2xl font-semibold text-indigo-300 mb-2">
          {current.label}
        </div>
        <p className="text-xs text-stone-500">{paradigm.title}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((opt, i) => {
          let bg = 'bg-stone-800 hover:bg-stone-700';
          if (showResult) {
            if (opt === current.text) bg = 'bg-emerald-900/50 border-emerald-500';
            else if (opt === selected) bg = 'bg-red-900/50 border-red-500';
            else bg = 'bg-stone-800 opacity-50';
          } else if (selected === opt) {
            bg = 'bg-indigo-600';
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={showResult}
              className={`${bg} border border-stone-700 rounded-xl px-4 py-4 text-center transition-colors`}
              style={{ fontFamily: "'Gentium Plus', 'GFS Didot', serif", fontSize: '20px' }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Score */}
      <div className="text-center text-sm text-stone-400">
        {correct}/{total} correct
      </div>
    </div>
  );
}
