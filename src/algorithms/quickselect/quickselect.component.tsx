import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE,
  K,
  MODE_LABELS,
  quickselectSteps,
  type LogKind,
  type QSMode,
  type QSStep,
} from './quickselect.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'the answer' },
  { color: 'bg-amber-400', label: 'pivot' },
  { color: 'bg-slate-800', label: 'discarded, never re-read' },
  { color: 'bg-sky-500', label: 'still in play' },
]

function Bars({ step }: { step: QSStep }) {
  const max = Math.max(...step.values)
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">
          array · find the {K}th largest
        </p>
        <p className="font-mono text-[10px] text-slate-500">
          window {step.lo}–{step.hi} · {step.discarded.length} discarded
        </p>
      </div>

      <div className="flex items-end gap-1">
        {step.values.map((v, i) => {
          const isAnswer = step.answer !== null && step.active.includes(i)
          const isPivot = step.pivot === i
          const gone = step.discarded.includes(i)
          const inWindow = i >= step.lo && i <= step.hi
          const cls = isAnswer
            ? 'bg-emerald-500'
            : isPivot
              ? 'bg-amber-500'
              : gone
                ? 'bg-slate-800'
                : inWindow
                  ? 'bg-sky-600/70'
                  : 'bg-slate-800'
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-sm transition-colors ${cls}`}
                style={{ height: `${12 + (v / max) * 88}px` }}
              />
              <span
                className={`font-mono text-[9px] ${gone ? 'text-slate-700' : 'text-slate-400'}`}
              >
                {v}
              </span>
            </div>
          )
        })}
      </div>

      {step.heap.length > 0 && (
        <div className="mt-3">
          <p className="text-[9px] uppercase tracking-widest text-slate-600">
            heap (root = weakest of the best)
          </p>
          <div className="mt-1 flex gap-1">
            {step.heap.map((h, i) => (
              <span
                key={i}
                className={`inline-flex h-7 w-9 items-center justify-center rounded border font-mono text-xs ${
                  i === 0
                    ? 'border-emerald-700 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatsPanel({ step }: { step: QSStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">work done</p>
      <div className="space-y-1">
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">comparisons</span>
          <span className="text-slate-300">{step.comparisons}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">still in play</span>
          <span className="text-sky-300">{Math.max(step.hi - step.lo + 1, 0)}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">discarded</span>
          <span className="text-slate-500">{step.discarded.length}</span>
        </div>
        {step.answer !== null && (
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-600">answer</span>
            <span className="text-emerald-400">{step.answer}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function VerdictPanel({ step }: { step: QSStep }) {
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
      <p className="font-mono text-[11px] text-slate-300">{verdict.work}</p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.complexity}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{verdict.note}</p>
    </div>
  )
}

function CodePanel({ step }: { step: QSStep }) {
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

const LOG_COLORS: Record<LogKind, string> = {
  compare: 'text-sky-400',
  swap: 'text-emerald-400',
  pivot: 'text-amber-300',
  discard: 'text-violet-300',
  heap: 'text-sky-300',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: QSStep }) {
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

function QSView({
  step,
  mode,
  onMode,
}: {
  step: QSStep
  mode: QSMode
  onMode: (m: QSMode) => void
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">approach</span>
        {(Object.keys(MODE_LABELS) as QSMode[]).map(m => (
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

      {step.phase === 'discard' && (
        <p className="border border-violet-800 bg-violet-500/5 px-3 py-2 font-mono text-[11px] text-violet-300">
          that half is gone — those elements are never compared again
        </p>
      )}

      <Bars step={step} />

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
              answer the follow-up before it arrives
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Quickselect is O(n) on average and O(n²) when the pivots are adversarial — always
              picking the last element on already-sorted input gives you the worst case every time.
              Randomize the pivot. Saying that unprompted is the difference between knowing the
              algorithm and having actually used it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Quickselect() {
  const [mode, setMode] = useState<QSMode>('sort')
  const steps = useMemo(() => collectSteps(quickselectSteps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <QSView step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
