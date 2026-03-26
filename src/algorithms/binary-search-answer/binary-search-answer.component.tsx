import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE,
  MAX_FEASIBLE,
  MIN_FEASIBLE,
  MODE_LABELS,
  ROWS,
  WORKERS,
  bsaSteps,
  type BSAMode,
  type BSAStep,
  type LogKind,
} from './binary-search-answer.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'fits in 4 workers' },
  { color: 'bg-rose-500', label: 'needs too many' },
  { color: 'bg-sky-400', label: 'current guess' },
  { color: 'bg-slate-700', label: 'never simulated' },
]

const WORKER_COLORS = [
  'bg-sky-500/70',
  'bg-violet-500/70',
  'bg-amber-500/70',
  'bg-emerald-500/70',
  'bg-rose-500/70',
  'bg-fuchsia-500/70',
  'bg-teal-500/70',
]

// ─── Packing ─────────────────────────────────────────────────────────────────

function PackingView({ step }: { step: BSAStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">
          rows packed into workers
        </p>
        <p className="font-mono text-[10px] text-slate-500">
          {step.guess !== null ? `capacity ${step.guess}` : `${ROWS.length} rows`}
          {step.used !== null && (
            <span className={step.feasible ? ' text-emerald-400' : ' text-rose-400'}>
              {' '}
              · {step.used} worker{step.used === 1 ? '' : 's'} needed
              {step.feasible ? ' ✓' : ` ✗ (limit ${WORKERS})`}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-1">
        {ROWS.map((row, i) => {
          const w = step.packing ? step.packing[i] : null
          const over = w !== null && w >= WORKERS
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-6 rounded-sm transition-colors ${
                  w === null
                    ? 'bg-slate-800'
                    : over
                      ? 'bg-rose-600/70'
                      : WORKER_COLORS[w % WORKER_COLORS.length]
                }`}
                style={{ height: `${8 + row * 4}px` }}
              />
              <span className="font-mono text-[9px] text-slate-600">{row}</span>
              {w !== null && (
                <span
                  className={`font-mono text-[8px] ${over ? 'text-rose-400' : 'text-slate-500'}`}
                >
                  w{w + 1}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-2 font-mono text-[10px] text-slate-600">
        largest single row is {MIN_FEASIBLE} — no capacity below that can ever work
      </p>
    </div>
  )
}

// ─── Search window ───────────────────────────────────────────────────────────

function WindowView({ step }: { step: BSAStep }) {
  const span = MAX_FEASIBLE - MIN_FEASIBLE
  const pct = (v: number) => ((v - MIN_FEASIBLE) / span) * 100

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-600">answer space</p>

      <div className="relative h-8 w-full rounded bg-slate-900">
        {/* live window */}
        <div
          className="absolute top-0 h-8 rounded bg-slate-700/50"
          style={{ left: `${pct(step.lo)}%`, width: `${Math.max(pct(step.hi) - pct(step.lo), 1)}%` }}
        />
        {/* everything tried */}
        {step.tried.map((t, i) => (
          <div
            key={i}
            className={`absolute top-1 h-6 w-1 rounded-sm ${t.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{ left: `${pct(t.size)}%` }}
          />
        ))}
        {/* current guess */}
        {step.guess !== null && (
          <div
            className="absolute -top-1 h-10 w-0.5 bg-sky-400"
            style={{ left: `${pct(step.guess)}%` }}
          />
        )}
      </div>

      <div className="mt-1 flex justify-between font-mono text-[9px] text-slate-600">
        <span>{MIN_FEASIBLE}</span>
        <span className="text-slate-400">
          window {step.lo}–{step.hi}
        </span>
        <span>{MAX_FEASIBLE}</span>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">simulations run</span>
          <span className="text-slate-300">{step.probes}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">candidates remaining</span>
          <span className="text-slate-300">{Math.max(step.hi - step.lo + 1, 0)}</span>
        </div>
        {step.best !== null && (
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-600">best so far</span>
            <span className="text-emerald-400">{step.best}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Verdict ─────────────────────────────────────────────────────────────────

function VerdictPanel({ step }: { step: BSAStep }) {
  if (!step.verdict) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">verdict</p>
        <p className="font-mono text-[11px] text-slate-700">run to the end</p>
      </div>
    )
  }
  const { verdict } = step
  const bad = step.mode === 'formula'
  return (
    <div
      className={`rounded border p-3 ${bad ? 'border-rose-800 bg-rose-500/5' : 'border-emerald-800 bg-emerald-500/5'}`}
    >
      <p
        className={`mb-2 text-[10px] uppercase tracking-widest ${bad ? 'text-rose-500' : 'text-emerald-500'}`}
      >
        {verdict.label}
      </p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.probes}</p>
      <p className="font-mono text-[11px] text-slate-300">answer: {verdict.answer}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{verdict.note}</p>
    </div>
  )
}

// ─── Code ────────────────────────────────────────────────────────────────────

function CodePanel({ step }: { step: BSAStep }) {
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
  probe: 'text-sky-400',
  ok: 'text-emerald-400',
  fail: 'text-rose-400',
  narrow: 'text-violet-300',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: BSAStep }) {
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

function BSAView({
  step,
  mode,
  onMode,
}: {
  step: BSAStep
  mode: BSAMode
  onMode: (m: BSAMode) => void
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">approach</span>
        {(Object.keys(MODE_LABELS) as BSAMode[]).map(m => (
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

      {step.mode === 'formula' && step.feasible === false && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          the average said {step.guess} — one row is bigger than that, so the worker holding it
          overruns on its own
        </p>
      )}
      {step.phase === 'narrow' && (
        <p className="border border-violet-800 bg-violet-500/5 px-3 py-2 font-mono text-[11px] text-violet-300">
          half the remaining answers discarded without simulating any of them
        </p>
      )}

      <PackingView step={step} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <CodePanel step={step} />
        <div className="space-y-4">
          <WindowView step={step} />
          <VerdictPanel step={step} />
        </div>
        <div className="space-y-4">
          <EventLog step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              the tell: monotonic feasibility
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              If a chunk size of 15 finishes in time, so does 16. Feasibility only ever runs one
              direction, which means the answers are sorted even though nobody sorted them — and
              anything sorted, you can binary search. Look for &quot;minimize the maximum&quot; or
              &quot;maximize the minimum&quot; in the problem statement; that phrasing is the
              giveaway.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function BinarySearchAnswer() {
  const [mode, setMode] = useState<BSAMode>('formula')
  const steps = useMemo(() => collectSteps(bsaSteps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <BSAView step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
