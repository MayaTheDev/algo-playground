import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE,
  MODE_LABELS,
  dependencyResolutionSteps,
  type LogKind,
  type ResolveMode,
  type ResolveStep,
} from './dependency-resolution.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'installed — safe' },
  { color: 'bg-rose-500', label: 'poisoned release' },
  { color: 'bg-sky-600', label: 'admitted by the range' },
  { color: 'bg-slate-800', label: 'outside the range' },
]

function Registry({ step }: { step: ResolveStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">
          npm registry · axios
        </p>
        <p className="font-mono text-[10px] text-slate-500">
          {step.registry.length} published
          {step.current && ` · resolving "${step.current.range}"`}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {step.registry.map(v => {
          const admitted = step.highlight.includes(v.raw)
          const cls = v.poisoned
            ? admitted
              ? 'border-rose-500 bg-rose-500/25 text-rose-200'
              : 'border-rose-900 bg-rose-500/10 text-rose-400/70'
            : admitted
              ? 'border-sky-600 bg-sky-600/25 text-sky-200'
              : 'border-slate-800 bg-slate-900 text-slate-600'
          return (
            <div
              key={v.raw}
              className={`flex flex-col items-center rounded border px-2 py-1 transition-colors ${cls}`}
            >
              <span className="font-mono text-[11px]">{v.raw}</span>
              {v.publishedAt && (
                <span className="font-mono text-[8px] uppercase tracking-wide text-rose-400">
                  {v.publishedAt}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResolutionTable({ step }: { step: ResolveStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
        package.json → what actually installs
      </p>
      {step.rows.length === 0 ? (
        <p className="font-mono text-[11px] text-slate-700">run to resolve</p>
      ) : (
        <table className="w-full">
          <tbody>
            <tr className="text-left font-mono text-[9px] uppercase tracking-widest text-slate-600">
              <th className="pb-1 font-normal">spec</th>
              <th className="pb-1 font-normal">means</th>
              <th className="pb-1 font-normal">admits</th>
              <th className="pb-1 font-normal">installs</th>
            </tr>
            {step.rows.map(r => (
              <tr key={r.spec.range} className="font-mono text-[11px] align-top">
                <td className="py-0.5 pr-2 text-amber-300">{r.spec.range}</td>
                <td className="py-0.5 pr-2 text-[10px] text-slate-500">{r.window}</td>
                <td className="py-0.5 pr-2 text-[10px] text-slate-500">{r.admitted.length}</td>
                <td
                  className={`py-0.5 ${
                    r.poisoned
                      ? 'text-rose-400'
                      : r.fromLockfile
                        ? 'text-sky-300'
                        : 'text-emerald-400'
                  }`}
                >
                  {r.chosen}
                  {r.poisoned && ' ⚠'}
                  {r.fromLockfile && !r.poisoned && (
                    <span className="ml-1 text-[9px] uppercase text-slate-600">locked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function VerdictPanel({ step }: { step: ResolveStep }) {
  if (!step.verdict) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">verdict</p>
        <p className="font-mono text-[11px] text-slate-700">run to the end</p>
      </div>
    )
  }
  const { verdict } = step
  const bad = step.rows.some(r => r.poisoned)
  return (
    <div
      className={`rounded border p-3 ${bad ? 'border-rose-800 bg-rose-500/5' : 'border-emerald-800 bg-emerald-500/5'}`}
    >
      <p
        className={`mb-2 text-[10px] uppercase tracking-widest ${bad ? 'text-rose-500' : 'text-emerald-500'}`}
      >
        {verdict.label}
      </p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.headline}</p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.detail}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{verdict.note}</p>
    </div>
  )
}

function CodePanel({ step }: { step: ResolveStep }) {
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
  resolve: 'text-sky-400',
  safe: 'text-emerald-400',
  poison: 'text-rose-400',
  lock: 'text-sky-300',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: ResolveStep }) {
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

function ResolveView({
  step,
  mode,
  onMode,
}: {
  step: ResolveStep
  mode: ResolveMode
  onMode: (m: ResolveMode) => void
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">view</span>
        {(Object.keys(MODE_LABELS) as ResolveMode[]).map(m => (
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

      {step.phase === 'publish' && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          17:21 PDT — two releases published from a compromised maintainer account
        </p>
      )}

      <Registry step={step} />
      <ResolutionTable step={step} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <CodePanel step={step} />
        <VerdictPanel step={step} />
        <div className="space-y-4">
          <EventLog step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              the four characters that decide this
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              <span className="font-mono text-amber-300">^</span> allows changes that do not touch
              the leftmost non-zero number — so on a 1.x it permits minor bumps, and on a 0.x it
              permits only patches.{' '}
              <span className="font-mono text-amber-300">~</span> permits patches. Both of them
              accept a release published thirty seconds ago, which is the part that matters. The
              caret is npm&apos;s default, so most people are running it without ever having chosen
              it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DependencyResolution() {
  const [mode, setMode] = useState<ResolveMode>('ranges')
  const steps = useMemo(() => collectSteps(dependencyResolutionSteps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <ResolveView step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
