import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE,
  MODE_LABELS,
  cycleSteps,
  type CycleMode,
  type CycleStep,
  type LogKind,
} from './linked-list-cycle.logic'

const LEGEND = [
  { color: 'bg-sky-400', label: 'slow pointer' },
  { color: 'bg-violet-400', label: 'fast pointer' },
  { color: 'bg-emerald-400', label: 'both — they met' },
  { color: 'bg-amber-400', label: 'held in the set' },
]

// ─── List ────────────────────────────────────────────────────────────────────

function ListView({ step }: { step: CycleStep }) {
  const { nodes } = step

  const nodeClass = (id: number) => {
    const isSlow = step.slow === id
    const isFast = step.fast === id
    if (isSlow && isFast) return 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
    if (isFast) return 'border-violet-600 bg-violet-500/15 text-violet-200'
    if (isSlow) return 'border-sky-600 bg-sky-500/15 text-sky-200'
    if (step.seen.includes(id)) return 'border-amber-800 bg-amber-500/10 text-amber-300'
    return 'border-slate-800 bg-slate-900 text-slate-400'
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">linked list</p>
        <p className="font-mono text-[10px] text-slate-500">
          {step.mode === 'acyclic' ? 'tail → null' : 'tail → D'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {nodes.map((n, i) => (
          <div key={n.id} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-4 gap-0.5">
                {step.slow === n.id && (
                  <span className="font-mono text-[9px] text-sky-400">slow</span>
                )}
                {step.fast === n.id && (
                  <span className="font-mono text-[9px] text-violet-400">fast</span>
                )}
              </div>
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded border font-mono text-sm transition-colors ${nodeClass(n.id)}`}
              >
                {n.value}
              </span>
            </div>
            {i < nodes.length - 1 && <span className="font-mono text-xs text-slate-700">→</span>}
          </div>
        ))}
      </div>

      {/* the back-edge */}
      {step.mode !== 'acyclic' ? (
        <div className="mt-2 flex items-center gap-2">
          <svg viewBox="0 0 300 24" className="h-6 w-full max-w-md">
            <path
              d="M 290 4 L 290 16 L 100 16 L 100 4"
              fill="none"
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <polygon points="100,2 96,9 104,9" fill="#475569" />
          </svg>
          <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">
            I → D (the loop)
          </span>
        </div>
      ) : (
        <p className="mt-2 font-mono text-[10px] text-slate-600">I → null (the list ends)</p>
      )}
    </div>
  )
}

// ─── Memory ──────────────────────────────────────────────────────────────────

function MemoryPanel({ step }: { step: CycleStep }) {
  const growing = step.mode === 'hashset'
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">memory in use</p>

      <div className="flex items-end gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`h-8 flex-1 rounded-sm transition-colors ${
              i < step.memory
                ? growing
                  ? 'bg-amber-500/70'
                  : 'bg-emerald-500/70'
                : 'bg-slate-900'
            }`}
          />
        ))}
      </div>

      <p className="mt-2 font-mono text-[11px]">
        <span className={growing ? 'text-amber-300' : 'text-emerald-300'}>
          {step.memory} reference{step.memory === 1 ? '' : 's'}
        </span>
        <span className="text-slate-600"> · {growing ? 'grows with n' : 'constant'}</span>
      </p>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">steps taken</span>
          <span className="text-slate-300">{step.ticks}</span>
        </div>
        {step.seen.length > 0 && (
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-600">set contents</span>
            <span className="text-amber-300">
              {step.seen.map(i => step.nodes[i].value).join(' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Verdict ─────────────────────────────────────────────────────────────────

function VerdictPanel({ step }: { step: CycleStep }) {
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
      <p className="font-mono text-[11px] text-slate-300">{verdict.time}</p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.space}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{verdict.note}</p>
    </div>
  )
}

// ─── Code ────────────────────────────────────────────────────────────────────

function CodePanel({ step }: { step: CycleStep }) {
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
  visit: 'text-sky-400',
  store: 'text-amber-300',
  meet: 'text-emerald-400',
  exit: 'text-violet-300',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: CycleStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">event log</p>
      <div className="space-y-0.5">
        {step.log.map((line, i) => (
          <p key={`${i}-${line.text}`} className={`font-mono text-[10px] ${LOG_COLORS[line.kind]}`}>
            {line.text}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── View ────────────────────────────────────────────────────────────────────

function CycleView({
  step,
  mode,
  onMode,
}: {
  step: CycleStep
  mode: CycleMode
  onMode: (m: CycleMode) => void
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">approach</span>
        {(Object.keys(MODE_LABELS) as CycleMode[]).map(m => (
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

      {step.met && (
        <p className="border border-emerald-800 bg-emerald-500/5 px-3 py-2 font-mono text-[11px] text-emerald-300">
          {step.mode === 'hashset'
            ? 'a node came back — cycle confirmed, at the cost of remembering all of them'
            : 'the pointers landed on the same node — cycle confirmed, holding two references'}
        </p>
      )}
      {step.fellOff && (
        <p className="border border-violet-800 bg-violet-500/5 px-3 py-2 font-mono text-[11px] text-violet-300">
          the fast pointer ran off the end — a loop could never have let it escape
        </p>
      )}

      <ListView step={step} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <CodePanel step={step} />
        <div className="space-y-4">
          <MemoryPanel step={step} />
          <VerdictPanel step={step} />
        </div>
        <div className="space-y-4">
          <EventLog step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              why the meeting is guaranteed
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Once both pointers are inside the loop, the fast one gains exactly one node on the
              slow one every step. A gap that shrinks by one each time cannot be jumped over — it
              has to pass through zero. That is the whole proof, and it is why you never need to
              remember where you have been.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function LinkedListCycle() {
  const [mode, setMode] = useState<CycleMode>('hashset')
  const steps = useMemo(() => collectSteps(cycleSteps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <CycleView step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
