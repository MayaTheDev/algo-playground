import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE_LINES,
  NODES,
  OPTIONAL_EDGES,
  PHASE_LINES,
  edgeKey,
  nodeLabel,
  summarizeRun,
  topologicalSortV2Steps,
  type TopoV2Step,
} from './topological-sort-v2.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'emitting' },
  { color: 'bg-sky-900', label: 'in queue' },
  { color: 'bg-emerald-900', label: 'emitted' },
  { color: 'bg-rose-500', label: 'never reached zero' },
]

// ─── Graph ───────────────────────────────────────────────────────────────────

function cycleEdgeSet(cycle: string[] | null): Set<string> {
  const set = new Set<string>()
  if (!cycle) return set
  for (let i = 0; i < cycle.length - 1; i++) set.add(edgeKey(cycle[i], cycle[i + 1]))
  return set
}

function GraphView({ step }: { step: TopoV2Step }) {
  const { nodes, edges, inDegree, queue, order, current, reducedEdge, consumedEdges, stuck, cycle } = step
  const cycleEdges = useMemo(() => cycleEdgeSet(cycle), [cycle])
  const stuckSet = new Set(stuck)

  return (
    <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-lg">
      <defs>
        <marker id="tv2-arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#475569" />
        </marker>
        <marker id="tv2-arrow-active" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#34d399" />
        </marker>
        <marker id="tv2-arrow-cycle" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#f43f5e" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map(edge => {
        const a = nodes.find(n => n.id === edge.from)!
        const b = nodes.find(n => n.id === edge.to)!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const r = 5.5
        const x1 = a.x + (dx / len) * r
        const y1 = a.y + (dy / len) * r
        const x2 = b.x - (dx / len) * (r + 1.2)
        const y2 = b.y - (dy / len) * (r + 1.2)

        const key = edgeKey(edge.from, edge.to)
        const isReduced = reducedEdge?.[0] === edge.from && reducedEdge?.[1] === edge.to
        const isCycle = cycleEdges.has(key)
        const isConsumed = consumedEdges.includes(key)

        const stroke = isCycle ? '#f43f5e' : isReduced ? '#34d399' : isConsumed ? '#1e3a2f' : '#334155'
        const marker = isCycle
          ? 'url(#tv2-arrow-cycle)'
          : isReduced
            ? 'url(#tv2-arrow-active)'
            : 'url(#tv2-arrow)'

        return (
          <line
            key={key}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth={isReduced || isCycle ? 0.9 : 0.5}
            strokeDasharray={edge.optional ? '2 1.2' : undefined}
            markerEnd={marker}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const emitted = order.includes(node.id)
        const isCurrent = node.id === current
        const inQueue = queue.includes(node.id)
        const isStuck = stuckSet.has(node.id)
        const onCycle = cycle?.includes(node.id) ?? false

        let fill = '#1e293b'
        let stroke = '#475569'
        let textFill = '#e2e8f0'

        if (isCurrent) {
          fill = '#34d399'
          stroke = '#34d399'
          textFill = '#020617'
        } else if (emitted) {
          fill = '#064e3b'
          stroke = '#34d399'
        } else if (onCycle) {
          fill = '#4c0519'
          stroke = '#f43f5e'
          textFill = '#fda4af'
        } else if (isStuck) {
          fill = '#27151f'
          stroke = '#9f1239'
          textFill = '#fda4af'
        } else if (inQueue) {
          fill = '#0c2a3f'
          stroke = '#38bdf8'
        }

        return (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={5.5} fill={fill} stroke={stroke} strokeWidth={0.6} />
            <text
              x={node.x}
              y={node.y + 1.1}
              textAnchor="middle"
              fontSize={2.8}
              fontFamily="monospace"
              fill={textFill}
              fontWeight={isCurrent ? 'bold' : 'normal'}
            >
              {node.id}
            </text>
            <text
              x={node.x}
              y={node.y + 9}
              textAnchor="middle"
              fontSize={2.3}
              fontFamily="monospace"
              fill="#64748b"
            >
              {node.label}
            </text>

            {/* Live in-degree */}
            <circle
              cx={node.x + 4.6}
              cy={node.y - 4.6}
              r={2.2}
              fill="#020617"
              stroke={inDegree[node.id] === 0 ? '#34d399' : isStuck ? '#f43f5e' : '#475569'}
              strokeWidth={0.4}
            />
            <text
              x={node.x + 4.6}
              y={node.y - 3.7}
              textAnchor="middle"
              fontSize={2.2}
              fontFamily="monospace"
              fill={inDegree[node.id] === 0 ? '#34d399' : isStuck ? '#fda4af' : '#94a3b8'}
            >
              {inDegree[node.id]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── In-degree ledger ────────────────────────────────────────────────────────

function InDegreeLedger({ step }: { step: TopoV2Step }) {
  const stuckSet = new Set(step.stuck)

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">in-degree ledger</p>
      <div className="grid grid-cols-[auto_auto_auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[10px]">
        <span className="text-slate-600">node</span>
        <span className="text-right text-slate-600">start</span>
        <span className="text-right text-slate-600">now</span>
        <span className="text-slate-600">waiting on</span>
        {NODES.map(node => {
          const emitted = step.order.includes(node.id)
          const now = step.inDegree[node.id]
          const isStuck = stuckSet.has(node.id)
          const justReduced = step.reducedEdge?.[1] === node.id

          return (
            <div key={node.id} className="contents">
              <span className={emitted ? 'text-emerald-500' : isStuck ? 'text-rose-400' : 'text-slate-300'}>
                {node.id}
              </span>
              <span className="text-right text-slate-600">{step.initialInDegree[node.id]}</span>
              <span
                className={`text-right ${
                  justReduced
                    ? 'text-emerald-300'
                    : now === 0
                      ? 'text-slate-500'
                      : isStuck
                        ? 'text-rose-400'
                        : 'text-amber-300'
                }`}
              >
                {now}
              </span>
              <span className="truncate text-slate-600">
                {emitted ? 'emitted' : step.waitingOn[node.id].join(', ') || '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── The output, and how long it is ──────────────────────────────────────────

function OrderStrip({ step }: { step: TopoV2Step }) {
  const missing = NODES.length - step.order.length
  const failed = step.check !== null && !step.check.passed

  return (
    <div
      className={`rounded border p-3 ${
        failed ? 'border-rose-800 bg-rose-500/5' : 'border-slate-800 bg-slate-950/40'
      }`}
    >
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">order</p>
        <span
          className={`font-mono text-[11px] ${
            failed ? 'text-rose-400' : step.order.length === NODES.length ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          {step.order.length} / {NODES.length}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {step.order.map((id, i) => (
          <span key={id} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-700">→</span>}
            <span className="border border-emerald-900 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
              {id}
            </span>
          </span>
        ))}
        {step.order.length === 0 && <span className="font-mono text-[10px] text-slate-700">empty</span>}
        {step.check !== null &&
          missing > 0 &&
          Array.from({ length: missing }, (_, i) => (
            <span key={`missing-${i}`} className="flex items-center gap-1">
              <span className="text-slate-700">→</span>
              <span className="border border-dashed border-rose-800 px-1.5 py-0.5 font-mono text-[10px] text-rose-500">
                ?
              </span>
            </span>
          ))}
      </div>

      {step.check !== null && (
        <p
          className={`mt-2 font-mono text-[10px] ${
            step.check.passed ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          order.length {step.check.passed ? '===' : '!=='} nodes.length →{' '}
          {step.check.orderLength} {step.check.passed ? '===' : '!=='} {step.check.nodeCount}
          {step.check.passed ? '  ✓ acyclic' : '  ✗ cycle — and this line is the only thing that noticed'}
        </p>
      )}
    </div>
  )
}

// ─── Kahn's algorithm, with the guard visible ────────────────────────────────

function CodePanel({ step }: { step: TopoV2Step }) {
  const active = new Set(PHASE_LINES[step.phase])
  const guardFailed = step.check !== null && !step.check.passed

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">kahn&apos;s algorithm</p>
      <div className="space-y-0.5">
        {CODE_LINES.map((line, i) => {
          const isGuard = i === 15 || i === 16
          const lit = active.has(i)
          return (
            <pre
              key={i}
              className={`whitespace-pre px-1.5 py-0.5 font-mono text-[10px] leading-relaxed ${
                lit && isGuard && guardFailed
                  ? 'bg-rose-500/10 text-rose-300'
                  : lit
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : isGuard
                      ? 'text-amber-400/70'
                      : 'text-slate-600'
              }`}
            >
              {line || ' '}
            </pre>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        Everything above the guard is happy to finish early. The loop has no idea it left work
        behind — an empty queue is its normal exit condition.
      </p>
    </div>
  )
}

// ─── Edge toggles ────────────────────────────────────────────────────────────

function EdgePanel({
  enabled,
  onToggle,
}: {
  enabled: string[]
  onToggle: (id: string) => void
}) {
  const summary = useMemo(() => summarizeRun(enabled), [enabled])

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">add a dependency</p>
      <div className="space-y-1.5">
        {OPTIONAL_EDGES.map(edge => {
          const on = enabled.includes(edge.id)
          return (
            <button
              key={edge.id}
              onClick={() => onToggle(edge.id)}
              className={`w-full border px-2 py-1.5 text-left transition-colors ${
                on
                  ? edge.createsCycle
                    ? 'border-rose-700 bg-rose-500/5'
                    : 'border-emerald-700 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <p className="flex items-center justify-between gap-2 font-mono text-[11px]">
                <span className={on ? 'text-slate-200' : 'text-slate-400'}>{edge.label}</span>
                <span className={`text-[9px] uppercase tracking-widest ${on ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {on ? 'on' : 'off'}
                </span>
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{edge.blurb}</p>
            </button>
          )
        })}
      </div>

      <p
        className={`mt-2 font-mono text-[10px] ${
          summary.complete ? 'text-emerald-400' : 'text-rose-400'
        }`}
      >
        this graph orders {summary.emitted}/{summary.total} nodes
        {summary.complete ? '' : ` — ${summary.stuck.map(nodeLabel).join(', ')} never run`}
      </p>
    </div>
  )
}

// ─── View ────────────────────────────────────────────────────────────────────

function TopologicalSortV2View({
  step,
  enabled,
  onToggle,
}: {
  step: TopoV2Step
  enabled: string[]
  onToggle: (id: string) => void
}) {
  const failed = step.check !== null && !step.check.passed

  return (
    <div className="w-full space-y-4">
      {failed && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          the sort returned successfully with {step.check!.orderLength} of {step.check!.nodeCount} steps —
          nothing threw, nothing logged, the deploy would have run a partial pipeline
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <div className="rounded border border-slate-800 bg-slate-950/30 p-3">
            <GraphView step={step} />
          </div>
          <OrderStrip step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">queue</p>
            <div className="flex flex-wrap items-center gap-1">
              {step.queue.map(id => (
                <span
                  key={id}
                  className="border border-sky-900 bg-sky-950/40 px-1.5 py-0.5 font-mono text-[10px] text-sky-300"
                >
                  {id}
                </span>
              ))}
              {step.queue.length === 0 && (
                <span className="font-mono text-[10px] text-slate-700">
                  empty — the loop exits here, whether or not the work is done
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <EdgePanel enabled={enabled} onToggle={onToggle} />
          <InDegreeLedger step={step} />
          <CodePanel step={step} />
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TopologicalSortV2() {
  const [enabled, setEnabled] = useState<string[]>([])
  const steps = useMemo(() => collectSteps(topologicalSortV2Steps(enabled)), [enabled])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  // A different graph is a different run.
  useEffect(() => {
    reset()
  }, [enabled, reset])

  const toggle = (id: string) => {
    setEnabled(prev => (prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <TopologicalSortV2View step={player.currentStep} enabled={enabled} onToggle={toggle} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
