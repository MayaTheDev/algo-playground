import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE,
  KEY,
  MODE_LABELS,
  NODE_IDS,
  formatClock,
  vectorClockV2Steps,
  type Comparison,
  type LogKind,
  type Replica,
  type VClockV2Mode,
  type VectorClockV2Step,
} from './vector-clock-v2.logic'

const LEGEND = [
  { color: 'bg-sky-400', label: 'node A' },
  { color: 'bg-violet-400', label: 'node B' },
  { color: 'bg-rose-500', label: 'partition / conflict' },
  { color: 'bg-amber-400', label: 'lock held' },
]

const NODE_ACCENT: Record<string, { text: string; border: string; dot: string }> = {
  A: { text: 'text-sky-300', border: 'border-sky-800', dot: 'bg-sky-400' },
  B: { text: 'text-violet-300', border: 'border-violet-800', dot: 'bg-violet-400' },
}

// ─── Replica card ────────────────────────────────────────────────────────────

function ReplicaCard({ node, step }: { node: Replica; step: VectorClockV2Step }) {
  const accent = NODE_ACCENT[node.id]
  const holdsLock = step.lock.holder === node.id
  const cutOff = step.lock.unreachable.includes(node.id)
  const wasRejected = step.lock.rejected === node.id

  return (
    <div
      className={`min-w-0 rounded border p-3 ${
        node.believesAuthoritative ? 'border-rose-700 bg-rose-500/5' : `${accent.border} bg-slate-950/40`
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${accent.dot}`} />
        <span className={`text-xs font-semibold ${accent.text}`}>Replica {node.id}</span>
        {holdsLock && (
          <span className="border border-amber-700 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-300">
            holds lock
          </span>
        )}
        {wasRejected && (
          <span className="border border-rose-800 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-rose-300">
            write rejected
          </span>
        )}
      </div>

      {/* Vector clock */}
      <p className="text-[9px] uppercase tracking-widest text-slate-600">vector clock</p>
      <div className="mt-1 flex gap-1">
        {node.clock.map((count, k) => (
          <div key={k} className="flex-1 text-center">
            <div className="text-[8px] uppercase text-slate-600">{NODE_IDS[k]}</div>
            <div
              className={`rounded py-0.5 font-mono text-xs ${
                NODE_IDS[k] === node.id ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {count}
            </div>
          </div>
        ))}
      </div>

      {/* Stored value */}
      <p className="mt-3 text-[9px] uppercase tracking-widest text-slate-600">{KEY}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {node.value.map(item => (
          <span
            key={item}
            className="border border-slate-800 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
          >
            {item}
          </span>
        ))}
      </div>

      {/* Status line */}
      <p className="mt-3 font-mono text-[10px] leading-relaxed">
        {node.believesAuthoritative ? (
          <span className="text-rose-400">believes it holds the authoritative write</span>
        ) : cutOff ? (
          <span className="text-slate-500">cut off from the lock service</span>
        ) : (
          <span className="text-slate-600">in sync as far as it knows</span>
        )}
        {node.outbox > 0 && (
          <span className="block text-amber-400">{node.outbox} replication undelivered</span>
        )}
      </p>
    </div>
  )
}

// ─── Link between the replicas ───────────────────────────────────────────────

function LinkBand({ step }: { step: VectorClockV2Step }) {
  const severed = step.link === 'partitioned'

  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-2 px-2">
      <span
        className={`font-mono text-[10px] uppercase tracking-widest ${
          severed ? 'text-rose-400' : 'text-emerald-400'
        }`}
      >
        {severed ? 'partitioned' : 'link up'}
      </span>

      <svg viewBox="0 0 60 24" className="w-full max-w-[120px]">
        <line
          x1={2}
          y1={12}
          x2={severed ? 24 : 58}
          y2={12}
          stroke={severed ? '#f43f5e' : '#34d399'}
          strokeWidth={1.4}
          strokeDasharray="4 3"
        />
        {severed && (
          <>
            <line x1={36} y1={12} x2={58} y2={12} stroke="#f43f5e" strokeWidth={1.4} strokeDasharray="4 3" />
            <line x1={26} y1={4} x2={34} y2={20} stroke="#f43f5e" strokeWidth={1.6} />
            <line x1={34} y1={4} x2={26} y2={20} stroke="#f43f5e" strokeWidth={1.6} />
          </>
        )}
      </svg>

      <div className="w-full space-y-1">
        {step.messages.map((m, i) => (
          <p
            key={`${m.from}-${m.to}-${i}`}
            className={`text-center font-mono text-[9px] ${
              m.state === 'dropped'
                ? 'text-rose-400 line-through'
                : m.state === 'queued'
                  ? 'text-amber-400'
                  : m.state === 'delivered'
                    ? 'text-emerald-400'
                    : 'text-slate-400'
            }`}
          >
            {m.from}→{m.to} {formatClock(m.clock)} {m.state}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── Lock table ──────────────────────────────────────────────────────────────

function LockPanel({ step }: { step: VectorClockV2Step }) {
  const { lock, mode } = step

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">lock service</p>

      {mode === 'race' ? (
        <p className="font-mono text-[11px] leading-relaxed text-slate-600">
          not in the write path.
          <span className="mt-1 block text-slate-500">
            Nothing is mediating access to {KEY}. Any replica may write it at any time, and the code
            has no place to even notice.
          </span>
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 border border-slate-800 bg-slate-900/60 px-2 py-1.5">
            <span className="font-mono text-[11px] text-slate-300">{KEY}</span>
            <span
              className={`font-mono text-[11px] ${
                lock.holder ? 'text-amber-300' : 'text-slate-500'
              }`}
            >
              {lock.holder ? `held by ${lock.holder}` : 'free'}
            </span>
          </div>
          {lock.unreachable.length > 0 && (
            <p className="font-mono text-[10px] text-rose-400">
              unreachable from: {lock.unreachable.join(', ')}
            </p>
          )}
          {lock.rejected && (
            <p className="font-mono text-[10px] text-rose-400">
              acquire failed for {lock.rejected} — the write never ran
            </p>
          )}
          <p className="text-[10px] leading-relaxed text-slate-500">
            The lock lives on the majority side. A minority replica cannot acquire it, so it cannot
            take the write — which is the entire point.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Write path, with the executing line lit ─────────────────────────────────

function CodePanel({ step }: { step: VectorClockV2Step }) {
  const lines = CODE[step.mode]

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">write path</p>
      <div className="space-y-0.5">
        {lines.map((line, i) => {
          const active = step.codeLine === i
          const isLockLine = step.mode === 'locked' && (i === 1 || i === 7 || i === 8)
          return (
            <pre
              key={i}
              className={`whitespace-pre px-1.5 py-0.5 font-mono text-[10px] leading-relaxed ${
                active
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : isLockLine
                    ? 'text-amber-400/80'
                    : 'text-slate-500'
              }`}
            >
              {line || ' '}
            </pre>
          )
        })}
      </div>
      {step.mode === 'locked' && (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          The release sits in <span className="font-mono text-amber-400">finally</span>. Without it, a
          replica that dies mid-write leaves {KEY} locked forever — trading a lost update for an
          outage.
        </p>
      )}
    </div>
  )
}

// ─── Clock comparison ────────────────────────────────────────────────────────

const VERDICT_STYLE: Record<Comparison['verdict'], { label: string; color: string }> = {
  'happened-before': { label: 'ordered — one strictly after the other', color: 'text-emerald-400' },
  concurrent: { label: 'concurrent (∥) — neither dominates', color: 'text-rose-400' },
  equal: { label: 'identical', color: 'text-slate-400' },
}

function ComparisonPanel({ step }: { step: VectorClockV2Step }) {
  const cmp = step.comparison

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">what the clock reports</p>
      {!cmp ? (
        <p className="font-mono text-[10px] text-slate-700">nothing to compare yet</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 font-mono text-[10px]">
            <span className="text-slate-600">slot</span>
            <span className="text-right text-sky-400">{cmp.leftLabel}</span>
            <span className="text-right text-violet-400">{cmp.rightLabel}</span>
            {NODE_IDS.map((id, k) => {
              const l = cmp.left[k]
              const r = cmp.right[k]
              return (
                <div key={id} className="contents">
                  <span className="text-slate-500">{id}</span>
                  <span className={`text-right ${l > r ? 'text-emerald-300' : 'text-slate-500'}`}>{l}</span>
                  <span className={`text-right ${r > l ? 'text-emerald-300' : 'text-slate-500'}`}>{r}</span>
                </div>
              )
            })}
          </div>
          <p className={`font-mono text-[11px] ${VERDICT_STYLE[cmp.verdict].color}`}>
            {formatClock(cmp.left)} vs {formatClock(cmp.right)} → {VERDICT_STYLE[cmp.verdict].label}
          </p>
          <p className="text-[10px] leading-relaxed text-slate-500">{cmp.note}</p>
        </div>
      )}
    </div>
  )
}

// ─── Log ─────────────────────────────────────────────────────────────────────

const LOG_COLORS: Record<LogKind, string> = {
  ok: 'text-emerald-400',
  warn: 'text-amber-400',
  conflict: 'text-rose-400',
  blocked: 'text-violet-300',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: VectorClockV2Step }) {
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

function VectorClockV2View({
  step,
  mode,
  onMode,
}: {
  step: VectorClockV2Step
  mode: VClockV2Mode
  onMode: (mode: VClockV2Mode) => void
}) {
  const bothClaim = step.nodes.every(n => n.believesAuthoritative)

  return (
    <div className="w-full space-y-4">
      {/* Mode toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">write path</span>
        {(Object.keys(MODE_LABELS) as VClockV2Mode[]).map(m => (
          <button
            key={m}
            onClick={() => onMode(m)}
            className={`px-2.5 py-1 font-mono text-[11px] border transition-colors ${
              m === mode
                ? 'border-emerald-600 bg-emerald-500/5 text-emerald-400'
                : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Verdict banners */}
      {bothClaim && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          both replicas returned OK for a write the other has never seen — two authoritative writes,
          one key
        </p>
      )}
      {step.lostWrite && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          lost write: &quot;{step.lostWrite}&quot; was accepted, acknowledged, and discarded during merge
        </p>
      )}
      {mode === 'locked' && step.lock.rejected && (
        <p className="border border-violet-800 bg-violet-500/5 px-3 py-2 font-mono text-[11px] text-violet-300">
          a write failed loudly instead of succeeding twice — the client can retry, and nothing was
          lost
        </p>
      )}

      {/* Replicas */}
      <div className="grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)]">
        <ReplicaCard node={step.nodes[0]} step={step} />
        <LinkBand step={step} />
        <ReplicaCard node={step.nodes[1]} step={step} />
      </div>

      {/* Panels */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <CodePanel step={step} />
        <div className="space-y-4">
          <LockPanel step={step} />
          <ComparisonPanel step={step} />
        </div>
        <div className="space-y-4">
          <EventLog step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              detection is not prevention
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              A vector clock answers &quot;did these two writes know about each other?&quot; It answers
              it correctly, every time, including here. It was never asked &quot;should this second
              write be allowed?&quot; — nothing in the write path asks that question until a lock is
              in it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function VectorClockV2() {
  const [mode, setMode] = useState<VClockV2Mode>('race')
  const steps = useMemo(() => collectSteps(vectorClockV2Steps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <VectorClockV2View step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
