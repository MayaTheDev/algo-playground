import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE,
  MODE_LABELS,
  N,
  unionFindSteps,
  type LogKind,
  type Node,
  type UnionFindMode,
  type UnionFindStep,
} from './union-find.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'representative (root)' },
  { color: 'bg-sky-400', label: 'on the find path' },
  { color: 'bg-amber-400', label: 'being merged' },
  { color: 'bg-slate-700', label: 'idle' },
]

// ─── Forest ──────────────────────────────────────────────────────────────────

function Forest({ step }: { step: UnionFindStep }) {
  const { nodes } = step

  // group nodes by their root so each tree renders as a column group
  const roots = nodes.filter(n => n.parent === n.id).map(n => n.id)
  const members = (root: number) => {
    const out: Node[] = []
    for (const n of nodes) {
      let cur = n.id
      let guard = 0
      while (nodes[cur].parent !== cur && guard++ < N) cur = nodes[cur].parent
      if (cur === root) out.push(n)
    }
    return out.sort((a, b) => a.depth - b.depth || a.id - b.id)
  }

  const nodeClass = (n: Node) => {
    if (step.active.includes(n.id)) return 'border-amber-500 bg-amber-500/15 text-amber-200'
    if (step.path.includes(n.id)) return 'border-sky-700 bg-sky-500/10 text-sky-300'
    if (n.parent === n.id) return 'border-emerald-700 bg-emerald-500/10 text-emerald-300'
    return 'border-slate-800 bg-slate-900 text-slate-400'
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">disjoint-set forest</p>
        <p className="font-mono text-[10px] text-slate-500">
          {roots.length} set{roots.length === 1 ? '' : 's'} · deepest chain {step.maxDepth}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {roots.map(root => (
          <div key={root} className="min-w-0 rounded border border-slate-800/70 bg-slate-950/60 p-2">
            <div className="flex flex-col gap-1">
              {members(root).map(n => (
                <div
                  key={n.id}
                  className="flex items-center gap-1.5"
                  style={{ paddingLeft: `${n.depth * 12}px` }}
                >
                  {n.depth > 0 && <span className="font-mono text-[9px] text-slate-700">└</span>}
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded border font-mono text-xs transition-colors ${nodeClass(n)}`}
                  >
                    {n.id}
                  </span>
                  {n.parent === n.id && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-600">
                      rep
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function StatsPanel({ step }: { step: UnionFindStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">cost</p>

      <div className="space-y-1">
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">hops this step</span>
          <span className="text-slate-300">{step.hops}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">hops total</span>
          <span className="text-slate-300">{step.totalHops}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">deepest chain</span>
          <span className={step.maxDepth > 3 ? 'text-rose-400' : 'text-emerald-400'}>
            {step.maxDepth}
          </span>
        </div>
      </div>

      {step.pair && (
        <p className="mt-3 border border-amber-800 bg-amber-500/5 px-2 py-1.5 font-mono text-[10px] text-amber-300">
          union({step.pair[0]}, {step.pair[1]})
        </p>
      )}

      {step.path.length > 1 && (
        <div className="mt-3">
          <p className="text-[9px] uppercase tracking-widest text-slate-600">find path</p>
          <p className="mt-1 font-mono text-[11px] text-sky-300">{step.path.join(' → ')}</p>
        </div>
      )}
    </div>
  )
}

// ─── Verdict ─────────────────────────────────────────────────────────────────

function VerdictPanel({ step }: { step: UnionFindStep }) {
  if (!step.verdict) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">verdict</p>
        <p className="font-mono text-[11px] text-slate-700">run to the end</p>
      </div>
    )
  }
  const { verdict } = step
  return (
    <div className="rounded border border-emerald-800 bg-emerald-500/5 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-emerald-500">{verdict.label}</p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.steps}</p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.depth}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{verdict.note}</p>
    </div>
  )
}

// ─── Code ────────────────────────────────────────────────────────────────────

function CodePanel({ step }: { step: UnionFindStep }) {
  const lines = CODE[step.mode]
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
        {MODE_LABELS[step.mode]}
      </p>
      <div className="space-y-0.5">
        {lines.map((line, i) => (
          <pre
            key={i}
            className={`whitespace-pre-wrap font-mono text-[10px] leading-relaxed ${
              i === step.codeLine ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-500'
            }`}
          >
            {line || ' '}
          </pre>
        ))}
      </div>
    </div>
  )
}

// ─── Log ─────────────────────────────────────────────────────────────────────

const LOG_COLORS: Record<LogKind, string> = {
  union: 'text-amber-300',
  find: 'text-sky-400',
  compress: 'text-emerald-400',
  merge: 'text-violet-300',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: UnionFindStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">event log</p>
      <div className="space-y-0.5">
        {step.log.map((line, i) => (
          <p key={`${i}-${line.text}`} className={`font-mono text-[10px] ${LOG_COLORS[line.kind]}`}>
            {line.text}
          </p>
        ))}
        {step.log.length === 0 && <p className="font-mono text-[10px] text-slate-700">empty</p>}
      </div>
    </div>
  )
}

// ─── View ────────────────────────────────────────────────────────────────────

function UnionFindView({
  step,
  mode,
  onMode,
}: {
  step: UnionFindStep
  mode: UnionFindMode
  onMode: (m: UnionFindMode) => void
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">strategy</span>
        {(Object.keys(MODE_LABELS) as UnionFindMode[]).map(m => (
          <button
            key={m}
            onClick={() => onMode(m)}
            className={`border px-2.5 py-1 font-mono text-[11px] transition-colors ${
              m === mode
                ? 'border-emerald-600 bg-emerald-500/5 text-emerald-400'
                : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {step.maxDepth >= 5 && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          the forest has degenerated into a chain — every query now walks the whole thing
        </p>
      )}
      {step.phase === 'compress' && (
        <p className="border border-emerald-800 bg-emerald-500/5 px-3 py-2 font-mono text-[11px] text-emerald-300">
          path compressed — those nodes now point straight at the representative
        </p>
      )}

      <Forest step={step} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <CodePanel step={step} />
        <div className="space-y-4">
          <StatsPanel step={step} />
          <VerdictPanel step={step} />
        </div>
        <div className="space-y-4">
          <EventLog step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              the representative is arbitrary
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Union-find never stores the groups. It stores a parent pointer per element, and the
              element at the top is whichever one the merges happened to leave there. It is not the
              most important member and it was never chosen. The set is real; the label on it is an
              accident of the order things got joined.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function UnionFind() {
  const [mode, setMode] = useState<UnionFindMode>('naive')
  const steps = useMemo(() => collectSteps(unionFindSteps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <UnionFindView step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
