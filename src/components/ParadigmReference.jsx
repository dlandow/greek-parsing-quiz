import { useState } from 'react';
import { NOUN_PARADIGMS, VERB_PARADIGMS, ARTICLE_PARADIGM } from '../utils/paradigms';

export default function ParadigmReference({ onBack }) {
  const [tab, setTab] = useState('nouns');
  const [expanded, setExpanded] = useState(null);

  const paradigms = tab === 'nouns' ? [ARTICLE_PARADIGM, ...NOUN_PARADIGMS] : VERB_PARADIGMS;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 mb-6 flex items-center gap-1">
        <span>&larr;</span> Back
      </button>

      <h2 className="text-2xl font-semibold mb-6 text-stone-900 dark:text-stone-100">Paradigm Tables</h2>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab('nouns'); setExpanded(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'nouns'
              ? 'bg-indigo-600 text-white'
              : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
          }`}
        >
          Noun Declensions
        </button>
        <button
          onClick={() => { setTab('verbs'); setExpanded(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'verbs'
              ? 'bg-indigo-600 text-white'
              : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
          }`}
        >
          Verb Conjugations
        </button>
      </div>

      {/* Paradigm list */}
      <div className="space-y-3">
        {paradigms.map(p => (
          <div key={p.id} className="bg-stone-100 dark:bg-stone-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              className="w-full text-left p-4 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">{p.title}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5" style={{ fontFamily: "'Gentium Plus', serif" }}>
                {p.subtitle}
              </p>
            </button>

            {expanded === p.id && (
              <div className="px-4 pb-4">
                {/* Note */}
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                  {p.note}
                </p>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {p.headers.map((h, i) => (
                          <th
                            key={i}
                            className="text-left px-3 py-2 text-xs text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-700"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-stone-200/50 dark:border-stone-700/50">
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className={`px-3 py-2 ${
                                ci === 0
                                  ? 'text-stone-500 dark:text-stone-400 text-xs font-medium'
                                  : 'text-stone-800 dark:text-stone-200'
                              }`}
                              style={ci > 0 ? { fontFamily: "'Gentium Plus', serif", fontSize: '16px' } : {}}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Examples */}
                {p.examples && (
                  <div className="mt-3 text-sm text-stone-500 dark:text-stone-400" style={{ fontFamily: "'Gentium Plus', serif" }}>
                    {p.examples.split('\n').map((line, i) => (
                      <p key={i} className="mt-1">{line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
