import { useState, useMemo } from 'react'
import { buildTrie, getSuggestions } from './trie.logic'

const WORDS = ['search', 'sea', 'season', 'see', 'send', 'sort', 'swift', 'split']

export function Trie() {
  const [prefix, setPrefix] = useState('')
  const root = useMemo(() => buildTrie(WORDS), [])
  const suggestions = useMemo(() => getSuggestions(root, prefix), [root, prefix])
  const isValidPrefix = prefix === '' || suggestions.length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Input */}
          <div>
            <label className="block text-[10px] text-slate-600 uppercase tracking-widest mb-2">type a prefix</label>
            <input
              type="text"
              value={prefix}
              onChange={e => setPrefix(e.target.value.toLowerCase())}
              placeholder="sea..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 font-mono text-sm px-3 py-2 focus:outline-none focus:border-emerald-600 placeholder:text-slate-700"
            />
          </div>

          {/* Path visualization */}
          {prefix.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">trie path</p>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="px-2 py-1 text-xs font-mono border border-slate-700 text-slate-500">root</span>
                {prefix.split('').map((ch, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-slate-600">→</span>
                    <span className={`px-2 py-1 text-xs font-mono border ${
                      isValidPrefix ? 'border-emerald-600 text-emerald-400 bg-emerald-500/5' : 'border-red-700 text-red-400'
                    }`}>{ch}</span>
                  </span>
                ))}
                {isValidPrefix && prefix.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-1 text-xs font-mono border border-slate-700 text-slate-500">...</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">
              suggestions — {suggestions.length} match{suggestions.length !== 1 ? 'es' : ''}
            </p>
            {suggestions.length > 0 ? (
              <div className="space-y-1">
                {suggestions.map(word => (
                  <div key={word} className="font-mono text-sm px-3 py-1.5 bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400">{word.slice(0, prefix.length)}</span>
                    <span className="text-slate-400">{word.slice(prefix.length)}</span>
                  </div>
                ))}
              </div>
            ) : prefix.length > 0 ? (
              <p className="text-xs text-slate-600 font-mono">no matches — prefix not in trie</p>
            ) : (
              <div className="space-y-1">
                {WORDS.map(word => (
                  <div key={word} className="font-mono text-sm px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400">{word}</div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <p className="text-[10px] text-slate-600 font-mono">
            O(prefix length) lookup · {WORDS.length} words loaded · O(alphabet × max_word_length) space
          </p>
        </div>
      </div>

      {/* Static footer (no controls player) */}
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-[11px] text-slate-500 font-mono">
          prefix tree — {prefix ? `"${prefix}" → ${isValidPrefix ? suggestions.length + ' matches' : 'no path'}` : 'type to search'}
        </p>
      </div>
    </div>
  )
}
