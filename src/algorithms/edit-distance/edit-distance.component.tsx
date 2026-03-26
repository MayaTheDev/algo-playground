import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE,
  MODE_LABELS,
  SOURCE,
  TARGET,
  editDistanceSteps,
  type EditMode,
  type EditStep,
  type LogKind,
  type Op,
} from './edit-distance.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'match — free' },
  { color: 'bg-amber-400', label: 'cell being computed' },
  { color: 'bg-violet-400', label: 'on the diff path' },
  { color: 'bg-slate-700', label: 'computed' },
]

const OP_STYLE: Record<Op, { label: string; cls: string }> = {
  match: { label: 'keep', cls: 'text-slate-500' },
  substitute: { label: 'sub', cls: 'text-amber-300' },
  insert: { label: 'ins', cls: 'text-emerald-400' },
  delete: { label: 'del', cls: 'text-rose-400' },
}

function Grid({ step }: { step: EditStep }) {
  const inPath = (i: number, j: number) => step.path.some(([pi, pj]) => pi === i && pj === j)
  const isCursor = (i: number, j: number) => step.cursor?.[0] === i && step.cursor?.[1] === j
  const isCand = (i: number, j: number) => step.candidates.some(([ci, cj]) => ci === i && cj === j)

  return (
    <div className="overflow-x-auto rounded border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">
          &quot;{SOURCE}&quot; → &quot;{TARGET}&quot;
        </p>
        <p className="font-mono text-[10px] text-slate-500">
          {step.filled} cells{step.distance !== null && ` · distance ${step.distance}`}
        </p>
      </div>

      <table className="border-separate" style={{ borderSpacing: '2px' }}>
        <tbody>
          <tr>
            <td className="h-5 w-5" />
            <td className="h-5 w-5" />
            {TARGET.split('').map((c, j) => (
              <td key={j} className="h-5 w-5 text-center font-mono text-[9px] text-slate-500">
                {c === ' ' ? '␣' : c}
              </td>
            ))}
          </tr>
          {step.grid.map((row, i) => (
            <tr key={i}>
              <td className="h-5 w-5 text-center font-mono text-[9px] text-slate-500">
                {i === 0 ? '' : SOURCE[i - 1] === ' ' ? '␣' : SOURCE[i - 1]}
              </td>
              {row.map((cell, j) => {
                const cls = !cell
                  ? 'bg-slate-900/40 text-slate-800'
                  : isCursor(i, j)
                    ? 'bg-amber-500/70 text-slate-950'
                    : inPath(i, j)
                      ? 'bg-violet-500/60 text-slate-100'
                      : isCand(i, j)
                        ? 'bg-sky-600/50 text-slate-100'
                        : cell.from === 'match'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                return (
                  <td
                    key={j}
                    className={`h-5 w-5 rounded-sm text-center font-mono text-[9px] transition-colors ${cls}`}
                  >
                    {cell ? cell.value : ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DiffPanel({ step }: { step: EditStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
        recovered operations
      </p>
      {step.ops.length === 0 ? (
        <p className="font-mono text-[11px] text-slate-700">
          switch to &quot;Trace the diff&quot; and run
        </p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {step.ops.map((o, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] ${OP_STYLE[o.op].cls}`}
            >
              <span className="text-[8px] uppercase">{OP_STYLE[o.op].label}</span>
              <span>{o.char === ' ' ? '␣' : o.char}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function VerdictPanel({ step }: { step: EditStep }) {
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
      <p className="font-mono text-[11px] text-slate-300">{verdict.distance}</p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.ops}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{verdict.note}</p>
    </div>
  )
}

function CodePanel({ step }: { step: EditStep }) {
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
  fill: 'text-sky-400',
  match: 'text-emerald-400',
  edit: 'text-amber-300',
  path: 'text-violet-300',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: EditStep }) {
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

function EditView({
  step,
  mode,
  onMode,
}: {
  step: EditStep
  mode: EditMode
  onMode: (m: EditMode) => void
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">view</span>
        {(Object.keys(MODE_LABELS) as EditMode[]).map(m => (
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

      {step.phase === 'trace' && (
        <p className="border border-violet-800 bg-violet-500/5 px-3 py-2 font-mono text-[11px] text-violet-300">
          walking backward through the cells — this path is the diff
        </p>
      )}

      <Grid step={step} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <CodePanel step={step} />
        <div className="space-y-4">
          <DiffPanel step={step} />
          <VerdictPanel step={step} />
        </div>
        <div className="space-y-4">
          <EventLog step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              distance is not direction
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              The table measures how far apart two strings are, exactly, to the character. It has no
              opinion whatsoever about which one is better. It will report the same number whether
              you revised toward honesty or away from it — and nothing in the algorithm computes
              that part for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EditDistance() {
  const [mode, setMode] = useState<EditMode>('table')
  const steps = useMemo(() => collectSteps(editDistanceSteps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <EditView step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
