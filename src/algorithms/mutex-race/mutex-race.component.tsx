import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE,
  MODE_LABELS,
  mutexSteps,
  type LogKind,
  type MutexMode,
  type MutexStep,
  type Thread,
} from './mutex-race.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'running' },
  { color: 'bg-amber-400', label: 'waiting for a lock' },
  { color: 'bg-rose-500', label: 'blocked forever' },
  { color: 'bg-slate-700', label: 'done' },
]

const THREAD_ACCENT: Record<string, { text: string; border: string; dot: string }> = {
  T1: { text: 'text-sky-300', border: 'border-sky-800', dot: 'bg-sky-400' },
  T2: { text: 'text-violet-300', border: 'border-violet-800', dot: 'bg-violet-400' },
}

// ─── Thread card ─────────────────────────────────────────────────────────────

function ThreadCard({ thread, step }: { thread: Thread; step: MutexStep }) {
  const accent = THREAD_ACCENT[thread.id]
  const isActive = step.active === thread.id

  const stateClass =
    thread.state === 'running'
      ? 'text-emerald-400'
      : thread.state === 'waiting'
        ? 'text-amber-400'
        : thread.state === 'blocked'
          ? 'text-rose-400'
          : 'text-slate-500'

  return (
    <div
      className={`min-w-0 rounded border p-3 transition-colors ${
        isActive ? 'border-emerald-700 bg-emerald-500/5' : `${accent.border} bg-slate-950/40`
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${accent.dot}`} />
        <span className={`text-xs font-semibold ${accent.text}`}>{thread.id}</span>
        <span className={`font-mono text-[10px] uppercase tracking-widest ${stateClass}`}>
          {thread.state}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">deposits</span>
          <span className="text-slate-300">+{step.deposits[thread.id]}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">register</span>
          <span className={thread.register === null ? 'text-slate-700' : 'text-amber-300'}>
            {thread.register === null ? '—' : thread.register}
          </span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">holds</span>
          <span className={thread.holds.length ? 'text-emerald-400' : 'text-slate-700'}>
            {thread.holds.length ? thread.holds.join(', ') : '—'}
          </span>
        </div>
        {thread.waitingFor && (
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-600">waiting for</span>
            <span className="text-rose-400">{thread.waitingFor}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared memory ───────────────────────────────────────────────────────────

function MemoryPanel({ step }: { step: MutexStep }) {
  const expected = 100 + step.deposits.T1 + step.deposits.T2
  const wrong = step.lostUpdate

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">shared memory</p>

      <div
        className={`rounded border px-3 py-3 text-center ${
          wrong ? 'border-rose-700 bg-rose-500/10' : 'border-slate-800 bg-slate-900/60'
        }`}
      >
        <p className="text-[9px] uppercase tracking-widest text-slate-600">balance</p>
        <p className={`font-mono text-2xl ${wrong ? 'text-rose-300' : 'text-slate-200'}`}>
          {step.balance}
        </p>
        <p className="mt-1 font-mono text-[10px] text-slate-600">expected {expected}</p>
      </div>

      <div className="mt-3 space-y-1">
        {Object.entries(step.locks).map(([name, holder]) => (
          <div
            key={name}
            className="flex items-center justify-between border border-slate-800 bg-slate-900/60 px-2 py-1.5"
          >
            <span className="font-mono text-[11px] text-slate-300">{name}</span>
            <span className={`font-mono text-[11px] ${holder ? 'text-amber-300' : 'text-slate-500'}`}>
              {holder ? `held by ${holder}` : 'free'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Verdict ─────────────────────────────────────────────────────────────────

function VerdictPanel({ step }: { step: MutexStep }) {
  if (!step.verdict) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">verdict</p>
        <p className="font-mono text-[11px] text-slate-700">run to the end</p>
      </div>
    )
  }
  const { verdict } = step
  const bad = step.mode !== 'mutex'
  return (
    <div
      className={`rounded border p-3 ${bad ? 'border-rose-800 bg-rose-500/5' : 'border-emerald-800 bg-emerald-500/5'}`}
    >
      <p
        className={`mb-2 text-[10px] uppercase tracking-widest ${bad ? 'text-rose-500' : 'text-emerald-500'}`}
      >
        {verdict.label}
      </p>
      <p className="font-mono text-[11px] text-slate-300">result: {verdict.result}</p>
      <p className="font-mono text-[11px] text-slate-300">expected: {verdict.expected}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{verdict.note}</p>
    </div>
  )
}

// ─── Code ────────────────────────────────────────────────────────────────────

function CodePanel({ step }: { step: MutexStep }) {
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
  read: 'text-sky-400',
  write: 'text-emerald-400',
  lock: 'text-amber-300',
  unlock: 'text-slate-400',
  block: 'text-rose-400',
  lost: 'text-rose-300',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: MutexStep }) {
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

function MutexView({
  step,
  mode,
  onMode,
}: {
  step: MutexStep
  mode: MutexMode
  onMode: (m: MutexMode) => void
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">write path</span>
        {(Object.keys(MODE_LABELS) as MutexMode[]).map(m => (
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

      {step.lostUpdate && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          lost update — a deposit was accepted, acknowledged, and silently overwritten
        </p>
      )}
      {step.deadlocked && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          deadlock — each thread holds the lock the other one needs, and neither will release
        </p>
      )}

      <div className="grid items-stretch gap-3 md:grid-cols-2">
        {step.threads.map(t => (
          <ThreadCard key={t.id} thread={t} step={step} />
        ))}
      </div>

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
              neither thread is wrong
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Both threads do exactly what they were told: read the balance, add, write it back. The
              bug is not inside either one — it is in the fact that they run at the same time and
              read-modify-write is three operations pretending to be one. Undefined behaviour is the
              technical term for: it could be anything, and all of the anythings are bad.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function MutexRace() {
  const [mode, setMode] = useState<MutexMode>('race')
  const steps = useMemo(() => collectSteps(mutexSteps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <MutexView step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
