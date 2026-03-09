import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { bellmanFordSteps, type BellmanFordStep } from './bellman-ford.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'improved' },
  { color: 'bg-sky-400', label: 'checking' },
  { color: 'bg-amber-400', label: 'negative edge' },
  { color: 'bg-rose-500', label: 'negative cycle' },
]

function fmt(d: number): string {
  return d === Infinity ? '∞' : String(d)
}

// ── Graph SVG ────────────────────────────────────────────────────────────────

function BellmanGraph({ step }: { step: BellmanFordStep }) {
  const { nodes, edges, distances, activeEdge, improvedEdges, negativeCycle } = step

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-md mx-auto">
      <defs>
        <marker id="bf-arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#475569" />
        </marker>
        <marker id="bf-arrow-active" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#38bdf8" />
        </marker>
        <marker id="bf-arrow-improved" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#34d399" />
        </marker>
        <marker id="bf-arrow-negative" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#f59e0b" />
        </marker>
        <marker id="bf-arrow-cycle" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#f43f5e" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const a = nodes.find(n => n.id === edge.from)!
        const b = nodes.find(n => n.id === edge.to)!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const r = 5.5
        const x1 = a.x + (dx / len) * r
        const y1 = a.y + (dy / len) * r
        const x2 = b.x - (dx / len) * (r + 1.5)
        const y2 = b.y - (dy / len) * (r + 1.5)

        const isActive = activeEdge === i
        const isImproved = improvedEdges.includes(i)
        const isCycleEdge = negativeCycle && edge.weight < 0 && edge.from === 'D'
        const isNegative = edge.weight < 0

        let stroke = '#334155'
        let marker = 'bf-arrow'
        if (isCycleEdge) {
          stroke = '#f43f5e'
          marker = 'bf-arrow-cycle'
        } else if (isActive) {
          stroke = '#38bdf8'
          marker = 'bf-arrow-active'
        } else if (isImproved) {
          stroke = '#34d399'
          marker = 'bf-arrow-improved'
        } else if (isNegative) {
          stroke = '#f59e0b'
          marker = 'bf-arrow-negative'
        }

        // Bow the line when a reverse edge exists, so the two arrows stay readable
        const nx = -dy / len
        const ny = dx / len
        const hasReverse = edges.some(o => o.from === edge.to && o.to === edge.from)
        const bow = hasReverse ? 7 : 0
        const cx = (x1 + x2) / 2 + nx * bow
        const cy = (y1 + y2) / 2 + ny * bow
        const d = bow === 0
          ? `M ${x1} ${y1} L ${x2} ${y2}`
          : `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`

        // Label sits just off the midpoint of the (possibly bowed) line
        const mx = (x1 + x2) / 2 + nx * (bow / 2 + 3.5)
        const my = (y1 + y2) / 2 + ny * (bow / 2 + 3.5)

        return (
          <g key={`${edge.from}-${edge.to}`}>
            <path
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={isActive || isImproved || isCycleEdge ? 0.9 : 0.5}
              strokeOpacity={isActive || isImproved || isCycleEdge ? 1 : 0.7}
              strokeDasharray={isActive ? '2 1' : undefined}
              markerEnd={`url(#${marker})`}
            />
            <text
              x={mx} y={my + 1}
              textAnchor="middle"
              fontSize="3.2"
              fontFamily="monospace"
              fontWeight={isNegative ? 'bold' : 'normal'}
              fill={
                isCycleEdge ? '#fb7185'
                  : isActive ? '#38bdf8'
                    : isImproved ? '#34d399'
                      : isNegative ? '#fbbf24'
                        : '#64748b'
              }
            >
              {edge.weight}
            </text>
          </g>
        )
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const dist = distances[node.id]
        const touched = dist !== Infinity
        const activeEdgeDef = activeEdge !== null ? edges[activeEdge] : null
        const isEndpoint =
          activeEdgeDef !== null &&
          (activeEdgeDef.from === node.id || activeEdgeDef.to === node.id)

        return (
          <g key={node.id}>
            {isEndpoint && (
              <circle cx={node.x} cy={node.y} r={7.5} fill="none" stroke="#38bdf8" strokeWidth={0.3} opacity={0.6} />
            )}
            <circle
              cx={node.x} cy={node.y} r={5.5}
              fill={touched ? '#134e4a' : '#1e293b'}
              stroke={isEndpoint ? '#38bdf8' : touched ? '#34d399' : '#475569'}
              strokeWidth={0.7}
            />
            <text
              x={node.x} y={node.y + 1.2}
              textAnchor="middle" fontSize="3.6" fontFamily="monospace"
              fill="#e2e8f0"
            >
              {node.id}
            </text>
            <text
              x={node.x} y={node.y + 9}
              textAnchor="middle" fontSize="3" fontFamily="monospace"
              fill={touched ? '#34d399' : '#475569'}
            >
              {fmt(dist)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Pass strip: makes the "extra passes" visible ─────────────────────────────

function PassStrip({ step }: { step: BellmanFordStep }) {
  const { pass, totalPasses, passImprovements, phase } = step
  const detecting = pass > totalPasses

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">
        relaxation passes · V−1 = {totalPasses}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: totalPasses }, (_, i) => {
          const n = i + 1
          const done = passImprovements.length > i
          const improvements = passImprovements[i]
          const isCurrent = !detecting && pass === n
          return (
            <div
              key={n}
              className={`flex-1 min-w-[54px] rounded border px-2 py-1.5 text-center font-mono ${
                isCurrent
                  ? 'border-sky-600 bg-sky-500/10'
                  : done
                    ? improvements > 0
                      ? 'border-emerald-800 bg-emerald-500/5'
                      : 'border-slate-700 bg-slate-900/50'
                    : 'border-slate-800'
              }`}
            >
              <p className={`text-[10px] ${isCurrent ? 'text-sky-300' : 'text-slate-500'}`}>
                pass {n}
              </p>
              <p
                className={`text-xs ${
                  !done ? 'text-slate-700' : improvements > 0 ? 'text-emerald-400' : 'text-slate-600'
                }`}
              >
                {!done ? '—' : improvements > 0 ? `+${improvements}` : 'no change'}
              </p>
            </div>
          )
        })}
        <div
          className={`flex-1 min-w-[54px] rounded border px-2 py-1.5 text-center font-mono ${
            detecting
              ? step.negativeCycle
                ? 'border-rose-600 bg-rose-500/10'
                : 'border-amber-700 bg-amber-500/5'
              : 'border-slate-800'
          }`}
        >
          <p className={`text-[10px] ${detecting ? 'text-amber-300' : 'text-slate-500'}`}>detect</p>
          <p className={`text-xs ${detecting ? (step.negativeCycle ? 'text-rose-400' : 'text-amber-400') : 'text-slate-700'}`}>
            {!detecting ? '—' : step.negativeCycle ? 'cycle!' : 'clean'}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-600 leading-relaxed">
        {phase === 'pass-summary' && step.passImprovements[step.pass - 1] === 0
          ? 'A pass that changes nothing is not wasted work — it is the proof that nothing is left to change.'
          : 'Every pass re-checks every edge. No node is ever treated as final.'}
      </p>
    </div>
  )
}

// ── Distance table ───────────────────────────────────────────────────────────

function DistanceTable({ step }: { step: BellmanFordStep }) {
  const activeEdgeDef = step.activeEdge !== null ? step.edges[step.activeEdge] : null

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">dist[] · via</p>
      <div className="space-y-1">
        {step.nodes.map(n => {
          const isTarget = activeEdgeDef?.to === n.id
          const isSource = activeEdgeDef?.from === n.id
          return (
            <div
              key={n.id}
              className={`flex items-center justify-between px-2 py-1 rounded font-mono text-xs ${
                isTarget
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-300'
                  : isSource
                    ? 'bg-slate-800/60 border border-slate-700 text-slate-300'
                    : 'text-slate-400'
              }`}
            >
              <span>{n.id}</span>
              <span className="text-emerald-400">{fmt(step.distances[n.id])}</span>
              <span className="text-slate-600">
                {step.predecessors[n.id] ? `← ${step.predecessors[n.id]}` : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Dijkstra contrast ────────────────────────────────────────────────────────

function DijkstraContrast({ step }: { step: BellmanFordStep }) {
  if (!step.dijkstra) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">
          why not dijkstra
        </p>
        <p className="text-xs leading-relaxed text-slate-400">
          Dijkstra&apos;s settles nodes in increasing distance order and never reopens one. That is
          safe only when every edge costs something. One negative edge and the assumption breaks.
        </p>
        <p className="mt-2 font-mono text-[10px] text-slate-600">
          Bellman-Ford O(V × E) · Dijkstra O((V+E) log V)
        </p>
      </div>
    )
  }

  return (
    <div className="rounded border border-rose-900/60 bg-rose-950/10 p-3">
      <p className="text-[10px] uppercase tracking-widest text-rose-400/80 mb-3">
        dijkstra vs bellman-ford
      </p>
      <div className="mb-2 flex items-center justify-between px-2 font-mono text-[10px] text-slate-600">
        <span>node</span>
        <span>dijkstra</span>
        <span>bellman-ford</span>
      </div>
      <div className="space-y-1">
        {step.nodes.map(n => {
          const d = step.dijkstra!.distances[n.id]
          const bf = step.distances[n.id]
          const mismatch = d !== bf
          return (
            <div
              key={n.id}
              className={`flex items-center justify-between px-2 py-1 rounded font-mono text-xs ${
                mismatch ? 'bg-rose-500/10 border border-rose-500/30' : 'text-slate-400'
              }`}
            >
              <span className={mismatch ? 'text-rose-300' : ''}>{n.id}</span>
              <span className={mismatch ? 'text-rose-400' : 'text-slate-500'}>{fmt(d)}</span>
              <span className="text-emerald-400">{fmt(bf)}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 font-mono text-[10px] text-slate-500">
        settle order: {step.dijkstra.settled.join(' → ')}
      </p>
    </div>
  )
}

// ── Phase badge ──────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<BellmanFordStep['phase'], string> = {
  init: 'initializing',
  relax: 'relaxing edges',
  'pass-summary': 'pass complete',
  detect: 'detection pass',
  contrast: 'dijkstra contrast',
  'negative-cycle': 'negative cycle',
  done: 'done',
}

const PHASE_COLORS: Record<BellmanFordStep['phase'], string> = {
  init: 'text-slate-400 border-slate-700',
  relax: 'text-sky-400 border-sky-800',
  'pass-summary': 'text-emerald-400 border-emerald-800',
  detect: 'text-amber-400 border-amber-800',
  contrast: 'text-rose-400 border-rose-800',
  'negative-cycle': 'text-rose-400 border-rose-800',
  done: 'text-slate-400 border-slate-700',
}

// ── Main component ───────────────────────────────────────────────────────────

function BellmanFordView({ step }: { step: BellmanFordStep }) {
  const edgeChecks =
    step.pass > 0 ? Math.min(step.pass, step.totalPasses + 1) * step.edges.length : 0

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-[10px] uppercase tracking-widest border px-2 py-0.5 font-mono ${PHASE_COLORS[step.phase]}`}
        >
          {PHASE_LABELS[step.phase]}
        </span>
        <span className="font-mono text-[10px] text-slate-600">
          pass {Math.min(step.pass, step.totalPasses + 1)} / {step.totalPasses}
          {step.pass > step.totalPasses ? ' + detect' : ''}
        </span>
        <span className="font-mono text-[10px] text-slate-600">
          ~{edgeChecks} edge checks
        </span>
        {step.negativeCycle && (
          <span className="font-mono text-[10px] text-rose-400">negative cycle detected</span>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1fr)]">
        <div className="rounded border border-slate-800 bg-slate-950/30 p-4">
          <BellmanGraph step={step} />
        </div>

        <div className="min-w-0 space-y-3">
          <PassStrip step={step} />
          <div className="grid gap-3 md:grid-cols-2">
            <DistanceTable step={step} />
            <DijkstraContrast step={step} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function BellmanFord() {
  const steps = useMemo(() => collectSteps(bellmanFordSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <BellmanFordView step={player.currentStep} />
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
      />
    </div>
  )
}
