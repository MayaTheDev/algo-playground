import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { trieV2Steps } from './trie-v2.logic'
import type { TrieV2Step } from './trie-v2.logic'

// ─── Legend ────────────────────────────────────────────────────────────────

const LEGEND = [
  { color: 'bg-emerald-400', label: 'active path' },
  { color: 'bg-amber-400', label: 'end of word' },
  { color: 'bg-slate-600', label: 'inactive node' },
]

const PHASE_LABELS: Record<TrieV2Step['phase'], string> = {
  insert: 'INSERT',
  search: 'SEARCH',
  delete: 'DELETE',
  autocomplete: 'AUTOCOMPLETE',
}

const PHASE_COLORS: Record<TrieV2Step['phase'], string> = {
  insert: 'text-sky-400 border-sky-700',
  search: 'text-violet-400 border-violet-700',
  delete: 'text-rose-400 border-rose-700',
  autocomplete: 'text-emerald-400 border-emerald-700',
}

// ─── Trie tree layout ──────────────────────────────────────────────────────

/**
 * We lay the trie out as a tree. Each node holds a character key, its depth,
 * and a horizontal slot computed by DFS left-to-right assignment.
 */
type LayoutNode = {
  char: string          // character at this node
  fullPath: string      // full path from root (used to check highlightPath)
  isEnd: boolean
  x: number             // 0–100 viewport units
  y: number
  parentX: number | null
  parentY: number | null
}

function buildLayout(words: string[]): LayoutNode[] {
  // Rebuild trie locally just to get isEnd info
  type TNode = { children: Record<string, TNode>; isEnd: boolean }
  const root: TNode = { children: {}, isEnd: false }
  for (const w of words) {
    let n = root
    for (const ch of w) {
      if (!n.children[ch]) n.children[ch] = { children: {}, isEnd: false }
      n = n.children[ch]
    }
    n.isEnd = true
  }

  // Count total leaves to space the tree horizontally
  function countLeaves(n: TNode): number {
    const keys = Object.keys(n.children)
    if (keys.length === 0) return 1
    return keys.reduce((s, k) => s + countLeaves(n.children[k]), 0)
  }

  const nodes: LayoutNode[] = []
  let leafIdx = 0
  const totalLeaves = countLeaves(root) || 1

  function dfs(
    n: TNode,
    char: string,
    path: string,
    depth: number,
    px: number | null,
    py: number | null,
  ) {
    const keys = Object.keys(n.children).sort()
    const leafCount = countLeaves(n)
    // Centre of this node's horizontal span
    const x = ((leafIdx + leafCount / 2) / totalLeaves) * 88 + 6
    const y = 8 + depth * 17

    if (char !== '') {
      nodes.push({ char, fullPath: path, isEnd: n.isEnd, x, y, parentX: px, parentY: py })
    }

    if (keys.length === 0) {
      leafIdx++
    } else {
      for (const k of keys) {
        dfs(n.children[k], k, path + k, depth + 1, char === '' ? null : x, char === '' ? null : y)
      }
    }
  }

  dfs(root, '', '', 0, null, null)
  return nodes
}

// ─── TrieTreeView ──────────────────────────────────────────────────────────

type TreeViewProps = { step: TrieV2Step }

function TrieTreeView({ step }: TreeViewProps) {
  const { words, highlightPath, phase } = step
  const nodes = useMemo(() => buildLayout(words), [words])
  const viewBoxHeight = useMemo(() => {
    const maxY = nodes.reduce((bottom, node) => Math.max(bottom, node.y), 0)
    return Math.max(100, maxY + 12)
  }, [nodes])

  // Build a set of full path prefixes that are on the highlight path
  const highlightSet = useMemo(() => {
    const s = new Set<string>()
    let acc = ''
    for (const ch of highlightPath) {
      acc += ch
      s.add(acc)
    }
    return s
  }, [highlightPath])

  const isDeletePhase = phase === 'delete'

  return (
    <svg viewBox={`0 0 100 ${viewBoxHeight}`} className="h-full w-full max-w-full" preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={100} height={viewBoxHeight} fill="#020617" />

      {/* Root label */}
      <text x={50} y={5.5} textAnchor="middle" fontSize="2.8" fontFamily="monospace" fill="#475569">
        root
      </text>
      <circle cx={50} cy={7} r={1.5} fill="#1e293b" stroke="#475569" strokeWidth={0.4} />

      {/* Edges */}
      {nodes.map(n => {
        if (n.parentX === null || n.parentY === null) {
          // Edge from root circle to first-level node
          return (
            <line
              key={`edge-${n.fullPath}`}
              x1={50} y1={7}
              x2={n.x} y2={n.y}
              stroke={highlightSet.has(n.fullPath) ? (isDeletePhase ? '#f43f5e' : '#34d399') : '#1e293b'}
              strokeWidth={0.5}
            />
          )
        }
        return (
          <line
            key={`edge-${n.fullPath}`}
            x1={n.parentX} y1={n.parentY}
            x2={n.x} y2={n.y}
            stroke={highlightSet.has(n.fullPath) ? (isDeletePhase ? '#f43f5e' : '#34d399') : '#1e293b'}
            strokeWidth={0.5}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map(n => {
        const isActive = highlightSet.has(n.fullPath)
        const isLeafHighlight = isActive && n.fullPath === highlightPath.join('')

        let fill = '#1e293b'
        let stroke = '#334155'
        let textFill = '#64748b'

        if (isActive && isDeletePhase) {
          fill = '#4c0519'
          stroke = '#f43f5e'
          textFill = '#fb7185'
        } else if (isActive) {
          fill = '#022c22'
          stroke = '#34d399'
          textFill = '#6ee7b7'
        }

        // End-of-word marker — filled amber dot overlay
        const endDotColor = isActive
          ? isDeletePhase ? '#f43f5e' : '#34d399'
          : '#f59e0b'

        return (
          <g key={`node-${n.fullPath}`}>
            <circle cx={n.x} cy={n.y} r={4.2} fill={fill} stroke={stroke} strokeWidth={0.5} />
            <text
              x={n.x} y={n.y + 1.2}
              textAnchor="middle"
              fontSize="3"
              fontFamily="monospace"
              fontWeight={isLeafHighlight ? 'bold' : 'normal'}
              fill={textFill}
            >
              {n.char}
            </text>
            {/* End-of-word indicator: small filled circle at top-right */}
            {n.isEnd && (
              <circle
                cx={n.x + 3.2}
                cy={n.y - 3.2}
                r={1.2}
                fill={endDotColor}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Suggestions panel ─────────────────────────────────────────────────────

type SuggestionsPanelProps = { step: TrieV2Step }

function SuggestionsPanel({ step }: SuggestionsPanelProps) {
  const { suggestions, prefix, words } = step

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:flex xl:w-full xl:min-w-0 xl:max-w-none xl:flex-col">
      {/* Words in trie */}
      <div>
        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">in trie ({words.length})</p>
        <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
          {words.length === 0 && (
            <p className="text-[10px] text-slate-700 font-mono">—</p>
          )}
          {words.map(w => (
            <div key={w} className="font-mono text-[10px] text-slate-500 px-1.5 py-0.5 border border-slate-800 bg-slate-900/50">
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div>
        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">
          suggestions{prefix ? ` for "${prefix}"` : ''} ({suggestions.length})
        </p>
        {suggestions.length === 0 ? (
          <p className="text-[10px] text-slate-700 font-mono italic">—</p>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
            {suggestions.map(w => (
              <div key={w} className="font-mono text-[10px] px-1.5 py-0.5 border border-emerald-900/60 bg-emerald-950/30">
                <span className="text-emerald-400">{w.slice(0, prefix.length)}</span>
                <span className="text-slate-400">{w.slice(prefix.length)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function TrieV2() {
  const steps = useMemo(() => collectSteps(trieV2Steps()), [])
  const player = useAlgoPlayer(steps)
  const step = player.currentStep

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Main area */}
      <div className="grid flex-1 min-h-0 gap-3 overflow-auto p-3 xl:grid-cols-[minmax(0,1fr)_240px]">
        {/* Tree visualization */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Phase badge */}
          <div className="mb-2 flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border tracking-widest ${PHASE_COLORS[step.phase]}`}>
              {PHASE_LABELS[step.phase]}
            </span>
            {step.currentWord && (
              <span className="text-[10px] font-mono text-slate-500">
                target: <span className="text-slate-300">&quot;{step.currentWord}&quot;</span>
              </span>
            )}
            {step.prefix && !step.currentWord && (
              <span className="text-[10px] font-mono text-slate-500">
                prefix: <span className="text-slate-300">&quot;{step.prefix}&quot;</span>
              </span>
            )}
          </div>

          {/* Traversal path breadcrumb */}
          <div className="flex items-center gap-0.5 mb-2 flex-wrap min-h-[20px]">
            <span className="text-[9px] font-mono px-1.5 py-0.5 border border-slate-700 text-slate-500">root</span>
            {step.highlightPath.map((ch, i) => (
              <span key={i} className="flex items-center gap-0.5">
                <span className="text-slate-700 text-[9px]">→</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 border font-bold ${
                  step.phase === 'delete'
                    ? 'border-rose-700 text-rose-400 bg-rose-950/30'
                    : 'border-emerald-700 text-emerald-400 bg-emerald-950/30'
                }`}>
                  {ch}
                </span>
              </span>
            ))}
          </div>

          {/* SVG tree */}
          <div className="flex-1 min-h-0">
            <TrieTreeView step={step} />
          </div>
        </div>

        {/* Suggestions panel */}
        <SuggestionsPanel step={step} />
      </div>

      {/* Controls */}
      <Controls
        player={player}
        stepDescription={step.description}
        legend={LEGEND}
      />
    </div>
  )
}
