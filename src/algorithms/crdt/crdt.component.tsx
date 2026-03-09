import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { crdtSteps, type CrdtStep } from './crdt.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'active / resolved' },
  { color: 'bg-amber-400', label: 'conflict' },
  { color: 'bg-sky-400', label: 'sync arrow' },
]

// ── Sync Arrow ──────────────────────────────────────────────────────────────

function SyncArrow({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2">
      <span className="text-[9px] font-mono text-sky-400 uppercase tracking-widest whitespace-nowrap">
        {from} → {to}
      </span>
      <div className="flex items-center gap-0.5">
        <div className="h-[2px] w-10 bg-sky-500/70 rounded-full" />
        <div
          className="border-t-[5px] border-b-[5px] border-l-[8px]
                     border-t-transparent border-b-transparent border-l-sky-500"
        />
      </div>
      <span className="text-[8px] text-sky-600 font-mono">syncing ops</span>
    </div>
  )
}

// ── Replica Panel ───────────────────────────────────────────────────────────

function ReplicaPanel({
  replica,
  isActive,
  isConflict,
  isResolved,
  phase,
}: {
  replica: CrdtStep['replicas'][number]
  isActive: boolean
  isConflict: boolean
  isResolved: boolean
  phase: CrdtStep['phase']
}) {
  const isCounterMode = phase === 'counter'

  const borderColor = isResolved
    ? 'border-emerald-500/60'
    : isConflict
      ? 'border-amber-500/60'
      : isActive
        ? 'border-emerald-500/40'
        : 'border-slate-800'

  const headerColor = isResolved
    ? 'text-emerald-300'
    : isConflict
      ? 'text-amber-300'
      : isActive
        ? 'text-emerald-300'
        : 'text-slate-400'

  const docBg = isResolved
    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
    : isConflict
      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
      : 'bg-slate-900 border-slate-700 text-slate-200'

  return (
    <div className={`rounded border ${borderColor} bg-slate-950/50 p-4 flex flex-col gap-3 flex-1 min-w-0 transition-colors duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-mono font-semibold ${headerColor}`}>
          {replica.id}
        </span>
        {isActive && !isResolved && (
          <span className="text-[9px] uppercase tracking-widest text-emerald-500 border border-emerald-700 px-1.5 py-0.5">
            active
          </span>
        )}
        {isConflict && !isActive && (
          <span className="text-[9px] uppercase tracking-widest text-amber-500 border border-amber-700 px-1.5 py-0.5">
            conflict
          </span>
        )}
        {isResolved && (
          <span className="text-[9px] uppercase tracking-widest text-emerald-500 border border-emerald-700 px-1.5 py-0.5">
            converged
          </span>
        )}
      </div>

      {/* Document state or counter */}
      {isCounterMode ? (
        <div className="rounded border border-slate-800 bg-slate-900 p-3">
          <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1">g-counter slot</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-300">{replica.counter}</span>
            <span className="text-xs text-slate-500 font-mono">local slot</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-mono">
            vc: {'{'}
            {Object.entries(replica.vectorClock)
              .map(([k, v]) => `${k}:${v}`)
              .join(', ')}
            {'}'}
          </div>
        </div>
      ) : (
        <div className={`rounded border px-3 py-2 font-mono text-sm transition-colors duration-300 ${docBg}`}>
          <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1">document</p>
          <span className="break-all">
            {replica.document || <span className="text-slate-600 italic">empty</span>}
          </span>
        </div>
      )}

      {/* Vector clock */}
      {!isCounterMode && (
        <div className="rounded border border-slate-800 bg-slate-900/60 px-3 py-2">
          <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1">vector clock</p>
          <div className="flex gap-3">
            {Object.entries(replica.vectorClock).map(([peer, val]) => (
              <span key={peer} className="font-mono text-xs text-slate-400">
                <span className="text-slate-500">{peer}:</span>
                <span className="text-emerald-300 ml-1">{val}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Operation log */}
      <div className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2 flex-1">
        <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">operation log</p>
        {replica.operations.length === 0 ? (
          <p className="text-[10px] text-slate-700 font-mono italic">no operations yet</p>
        ) : (
          <ul className="space-y-1">
            {replica.operations.map((op, i) => (
              <li
                key={i}
                className={`text-[10px] font-mono leading-tight ${
                  i === replica.operations.length - 1 ? 'text-sky-300' : 'text-slate-500'
                }`}
              >
                <span className="text-slate-700 mr-1">{i + 1}.</span>
                {op}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Phase Badge ─────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: CrdtStep['phase'] }) {
  const map: Record<CrdtStep['phase'], { label: string; cls: string }> = {
    intro: { label: 'intro', cls: 'border-slate-600 text-slate-400' },
    'local-edit': { label: 'local edit', cls: 'border-sky-700 text-sky-400' },
    sync: { label: 'syncing', cls: 'border-sky-500 text-sky-300' },
    conflict: { label: 'conflict', cls: 'border-amber-600 text-amber-400' },
    resolved: { label: 'converged', cls: 'border-emerald-600 text-emerald-400' },
    counter: { label: 'g-counter', cls: 'border-purple-600 text-purple-400' },
  }
  const { label, cls } = map[phase]
  return (
    <span className={`text-[9px] uppercase tracking-widest border px-2 py-0.5 font-mono ${cls}`}>
      {label}
    </span>
  )
}

// ── Main View ────────────────────────────────────────────────────────────────

function CrdtView({ step }: { step: CrdtStep }) {
  const isConflict = step.phase === 'conflict'
  const isResolved = step.phase === 'resolved'

  // Global counter sum (for counter phase)
  const globalCount = step.replicas.reduce((sum, r) => {
    // In counter mode, sum the slot values from the vector clock
    const mySlot = r.vectorClock[r.id] ?? 0
    return sum + mySlot
  }, 0)

  return (
    <div className="w-full max-w-4xl space-y-4">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-600">crdt visualizer</span>
        </div>
        <PhaseBadge phase={step.phase} />
      </div>

      {/* Counter summary (only in counter phase) */}
      {step.phase === 'counter' && (
        <div className="rounded border border-purple-800/50 bg-purple-900/10 px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">global count (sum of all slots)</span>
          <span className="text-2xl font-mono font-bold text-purple-300">{globalCount}</span>
        </div>
      )}

      {/* Replica panels + optional sync arrow */}
      <div className="flex gap-3 items-stretch flex-wrap md:flex-nowrap">
        {step.replicas.map((replica, i) => {
          const isActive = step.activeReplica === replica.id
          const replicaInConflict =
            isConflict &&
            step.replicas.length > 1 &&
            step.replicas.some((r) => r.document !== replica.document || r.counter !== replica.counter)

          return (
            <div key={replica.id} className="flex gap-3 items-stretch flex-1 min-w-0">
              <ReplicaPanel
                replica={replica}
                isActive={isActive}
                isConflict={replicaInConflict && !isResolved}
                isResolved={isResolved}
                phase={step.phase}
              />
              {i < step.replicas.length - 1 && (
                <div className="flex items-center">
                  {step.syncArrow ? (
                    <SyncArrow from={step.syncArrow.from} to={step.syncArrow.to} />
                  ) : (
                    <div className="flex flex-col items-center gap-1 px-2">
                      <div className="h-[2px] w-8 bg-slate-800 rounded-full" />
                      <span className="text-[8px] text-slate-700 font-mono">isolated</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Phase description card */}
      <div
        className={`rounded border px-4 py-3 text-xs font-mono leading-relaxed transition-colors duration-300 ${
          isResolved
            ? 'border-emerald-800/50 bg-emerald-900/10 text-emerald-300'
            : isConflict
              ? 'border-amber-800/50 bg-amber-900/10 text-amber-300'
              : step.phase === 'sync'
                ? 'border-sky-800/50 bg-sky-900/10 text-sky-300'
                : 'border-slate-800 bg-slate-900/40 text-slate-400'
        }`}
      >
        {step.description}
      </div>

      {/* CRDT laws footer */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { law: 'commutative', note: 'A ∪ B = B ∪ A', desc: 'order of receipt does not matter' },
          { law: 'associative', note: '(A ∪ B) ∪ C = A ∪ (B ∪ C)', desc: 'grouping does not matter' },
          { law: 'idempotent', note: 'A ∪ A = A', desc: 'duplicate delivery is safe' },
        ].map(({ law, note, desc }) => (
          <div key={law} className="rounded border border-slate-800 bg-slate-950/40 px-3 py-2">
            <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">{law}</p>
            <p className="text-[10px] font-mono text-slate-400">{note}</p>
            <p className="text-[9px] text-slate-600 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Export ───────────────────────────────────────────────────────────────────

export function Crdt() {
  const steps = useMemo(() => collectSteps(crdtSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <CrdtView step={player.currentStep} />
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
      />
    </div>
  )
}
