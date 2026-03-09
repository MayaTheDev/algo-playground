import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { segmentTreeSteps, type SegmentTreeStep } from './segment-tree.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'active' },
  { color: 'bg-sky-400', label: 'finalized' },
  { color: 'bg-amber-400', label: 'updated' },
]

// ─── Tree layout helpers ──────────────────────────────────────────────────────

type NodeInfo = {
  index: number // 1-based tree index
  label: string // range label, e.g. "0..5"
  value: number // stored min value
  x: number // SVG x %
  y: number // SVG y %
  level: number
}

// Given a node index (1-based), compute its level and position.
// For a segment tree on N=6 elements the tree is about 4 levels deep.
// We compute the layout by doing a traversal and assigning x positions.

function layoutTree(tree: number[], n: number): NodeInfo[] {
  const nodes: NodeInfo[] = []

  function traverse(node: number, l: number, r: number, depth: number, xMin: number, xMax: number) {
    if (node >= tree.length || (tree[node] === 0 && l !== r && node > 2 * n)) return
    // Skip nodes that were never filled (value === 0 AND not a valid node for this N)
    // We use a simpler guard: only recurse if node index is plausible
    if (node > 4 * n) return

    const xCenter = (xMin + xMax) / 2
    const yPos = 10 + depth * 22

    nodes.push({
      index: node,
      label: l === r ? `${l}` : `${l}..${r}`,
      value: tree[node] ?? 0,
      x: xCenter,
      y: yPos,
      level: depth,
    })

    if (l < r) {
      const mid = Math.floor((l + r) / 2)
      traverse(2 * node, l, mid, depth + 1, xMin, xCenter)
      traverse(2 * node + 1, mid + 1, r, depth + 1, xCenter, xMax)
    }
  }

  traverse(1, 0, n - 1, 0, 0, 100)
  return nodes
}

// ─── SVG Tree View ────────────────────────────────────────────────────────────

function SegmentTreeView({ step }: { step: SegmentTreeStep }) {
  const n = step.array.length
  const nodes = useMemo(() => layoutTree(step.tree, n), [step.tree, n])

  // Build a map for quick lookup
  const nodeMap = useMemo(() => {
    const m: Record<number, NodeInfo> = {}
    for (const nd of nodes) m[nd.index] = nd
    return m
  }, [nodes])

  const isActive = (idx: number) => step.activeNodes.includes(idx)

  function nodeColor(nd: NodeInfo): { fill: string; stroke: string; text: string } {
    if (!isActive(nd.index)) {
      // Determine if node was "finalized" (filled and not currently active)
      const filled = step.tree[nd.index] !== undefined && step.tree[nd.index] !== 0
      if (step.phase === 'build' && filled) {
        return { fill: '#0c4a6e', stroke: '#38bdf8', text: '#7dd3fc' } // sky-900/400
      }
      return { fill: '#0f172a', stroke: '#334155', text: '#64748b' }
    }

    if (step.phase === 'update') {
      return { fill: '#78350f', stroke: '#f59e0b', text: '#fcd34d' } // amber
    }
    if (step.phase === 'query') {
      return { fill: '#064e3b', stroke: '#34d399', text: '#6ee7b7' } // emerald
    }
    // build phase active
    return { fill: '#064e3b', stroke: '#34d399', text: '#6ee7b7' }
  }

  // SVG dimensions
  const SVG_W = 100
  const SVG_H = 100
  const queryNodes = step.queryRange ? step.activeNodes.length : 0
  const activeRanges = nodes.filter((node) => step.activeNodes.includes(node.index)).map((node) => `[${node.label}]`)

  return (
    <div className="w-full space-y-4">
      {/* Phase badge */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-block rounded px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono ${
            step.phase === 'build'
              ? 'bg-sky-900/60 text-sky-300'
              : step.phase === 'query'
                ? 'bg-emerald-900/60 text-emerald-300'
                : 'bg-amber-900/60 text-amber-300'
          }`}
        >
          {step.phase}
        </span>
        {step.result !== null && (
          <span className="font-mono text-xs text-slate-400">
            result ={' '}
            <span
              className={
                step.phase === 'query'
                  ? 'text-emerald-300'
                  : step.phase === 'update'
                    ? 'text-amber-300'
                    : 'text-sky-300'
              }
            >
              {step.result}
            </span>
          </span>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]">
        {/* Binary tree SVG */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full min-h-[420px] border border-slate-800"
          style={{ background: '#020617' }}
        >
          {/* Edges */}
          {nodes.map((nd) => {
            const left = nodeMap[nd.index * 2]
            const right = nodeMap[nd.index * 2 + 1]
            return (
              <g key={`edges-${nd.index}`}>
                {left && (
                  <line
                    x1={nd.x}
                    y1={nd.y}
                    x2={left.x}
                    y2={left.y}
                    stroke={isActive(nd.index) && isActive(left.index) ? '#34d399' : '#1e293b'}
                    strokeWidth={0.5}
                  />
                )}
                {right && (
                  <line
                    x1={nd.x}
                    y1={nd.y}
                    x2={right.x}
                    y2={right.y}
                    stroke={isActive(nd.index) && isActive(right.index) ? '#34d399' : '#1e293b'}
                    strokeWidth={0.5}
                  />
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((nd) => {
            const { fill, stroke, text } = nodeColor(nd)
            const r = nd.level === 0 ? 6.5 : 5
            return (
              <g key={`node-${nd.index}`}>
                <circle cx={nd.x} cy={nd.y} r={r} fill={fill} stroke={stroke} strokeWidth={0.7} />
                {/* Value */}
                <text
                  x={nd.x}
                  y={nd.y + 1.5}
                  textAnchor="middle"
                  fontSize={nd.level === 0 ? 3.8 : 3.2}
                  fontFamily="monospace"
                  fill={text}
                >
                  {step.tree[nd.index] !== 0 || step.phase !== 'build' ? nd.value : ''}
                </text>
                {/* Range label below */}
                <text
                  x={nd.x}
                  y={nd.y + r + 3.5}
                  textAnchor="middle"
                  fontSize={2}
                  fontFamily="monospace"
                  fill="#475569"
                >
                  [{nd.label}]
                </text>
              </g>
            )
          })}

          {/* Query range indicator on x-axis */}
          {step.queryRange && (
            <g>
              {/* Highlight markers above array */}
              <text x={50} y={96} textAnchor="middle" fontSize={2.2} fontFamily="monospace" fill="#34d399">
                query [{step.queryRange[0]}..{step.queryRange[1]}]
              </text>
            </g>
          )}
        </svg>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
          <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">interview question</p>
            <p className="font-mono text-sm text-slate-300">
              {step.phase === 'query'
                ? 'Which visited nodes are fully inside the query range, and which get pruned?'
                : step.phase === 'update'
                  ? 'After the leaf changes, which ancestors must be recomputed?'
                  : 'Why can each internal node answer a whole range in O(1)?'}
            </p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">active ranges</p>
            <p className="font-mono text-sm text-emerald-300">
              {activeRanges.length > 0 ? activeRanges.join(' ') : 'none'}
            </p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">cost signal</p>
            <p className="font-mono text-sm text-slate-300">
              {step.phase === 'query' && step.queryRange
                ? `${queryNodes} active node${queryNodes === 1 ? '' : 's'} instead of scanning ${step.queryRange[1] - step.queryRange[0] + 1} array slots`
                : step.phase === 'update'
                  ? 'Only the root-to-leaf path changes'
                  : 'Build once, answer many range queries'}
            </p>
          </div>
        </div>
      </div>

      {/* Original array */}
      <div className="border border-slate-800 bg-slate-950/40 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">array</p>
        <div className="flex gap-1.5 flex-wrap">
          {step.array.map((val, i) => {
            const inQuery =
              step.queryRange !== null && i >= step.queryRange[0] && i <= step.queryRange[1]
            const isUpdated = step.phase === 'update' && step.activeNodes.length > 0 && i === 2

            return (
              <div
                key={i}
                className={`flex flex-col items-center min-w-[2.5rem] border px-3 py-2 font-mono text-sm transition-colors ${
                  isUpdated
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : inQuery
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 text-slate-300'
                }`}
              >
                <span>{val}</span>
                <span className="text-[10px] text-slate-600">{i}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SegmentTree() {
  const steps = useMemo(() => collectSteps(segmentTreeSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <SegmentTreeView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
