import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CAPACITY,
  CODE,
  LIMIT,
  MODE_LABELS,
  WINDOW,
  tokenBucketV2Steps,
  type Client,
  type LogKind,
  type TokenBucketV2Mode,
  type TokenBucketV2Step,
} from './token-bucket-v2.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'allowed' },
  { color: 'bg-rose-500', label: 'denied' },
  { color: 'bg-amber-400', label: 'bursting' },
  { color: 'bg-slate-600', label: 'store unreachable' },
]

const CLIENT_ACCENT: Record<string, { text: string; border: string; dot: string }> = {
  alpha: { text: 'text-sky-300', border: 'border-sky-800', dot: 'bg-sky-400' },
  beta: { text: 'text-amber-300', border: 'border-amber-800', dot: 'bg-amber-400' },
  gamma: { text: 'text-violet-300', border: 'border-violet-800', dot: 'bg-violet-400' },
}

// ─── Client card ─────────────────────────────────────────────────────────────

function ClientCard({ client, step }: { client: Client; step: TokenBucketV2Step }) {
  const accent = CLIENT_ACCENT[client.id]
  const isActive = step.active === client.id
  const blind = step.redis === 'down'

  return (
    <div
      className={`min-w-0 rounded border p-3 transition-colors ${
        isActive ? 'border-emerald-700 bg-emerald-500/5' : `${accent.border} bg-slate-950/40`
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${accent.dot}`} />
        <span className={`text-xs font-semibold ${accent.text}`}>{client.id}</span>
        {client.bursting && (
          <span className="border border-amber-700 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-300">
            bursting
          </span>
        )}
      </div>

      {/* Bucket / window gauge */}
      {step.mode === 'sliding' ? (
        <>
          <p className="text-[9px] uppercase tracking-widest text-slate-600">
            window ({WINDOW} ticks)
          </p>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div
                key={i}
                className={`h-5 flex-1 rounded-sm ${
                  i < client.window.length ? 'bg-rose-500/60' : 'bg-slate-900'
                }`}
              />
            ))}
          </div>
          <p className="mt-1 font-mono text-[10px] text-slate-500">
            {client.window.length}/{LIMIT} used
          </p>
        </>
      ) : (
        <>
          <p className="text-[9px] uppercase tracking-widest text-slate-600">tokens</p>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: CAPACITY }).map((_, i) => (
              <div
                key={i}
                className={`h-5 flex-1 rounded-sm ${
                  blind ? 'bg-slate-800' : i < Math.floor(client.tokens) ? 'bg-emerald-500/70' : 'bg-slate-900'
                }`}
              />
            ))}
          </div>
          <p className="mt-1 font-mono text-[10px] text-slate-500">
            {blind ? 'unknown — store unreachable' : `${Math.floor(client.tokens)}/${CAPACITY}`}
          </p>
        </>
      )}

      {/* Tally */}
      <div className="mt-3 grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-[8px] uppercase text-slate-600">sent</p>
          <p className="font-mono text-xs text-slate-300">{client.attempted}</p>
        </div>
        <div>
          <p className="text-[8px] uppercase text-slate-600">ok</p>
          <p className="font-mono text-xs text-emerald-400">{client.allowed}</p>
        </div>
        <div>
          <p className="text-[8px] uppercase text-slate-600">429</p>
          <p className="font-mono text-xs text-rose-400">{client.denied}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Store panel ─────────────────────────────────────────────────────────────

function StorePanel({ step }: { step: TokenBucketV2Step }) {
  const down = step.redis === 'down'

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">shared store</p>

      <div className="flex items-center justify-between gap-2 border border-slate-800 bg-slate-900/60 px-2 py-1.5">
        <span className="font-mono text-[11px] text-slate-300">redis</span>
        <span className={`font-mono text-[11px] ${down ? 'text-rose-400' : 'text-emerald-400'}`}>
          {down ? 'connection refused' : 'up'}
        </span>
      </div>

      {step.policy && (
        <p
          className={`mt-2 border px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest ${
            step.policy === 'open'
              ? 'border-amber-800 bg-amber-500/5 text-amber-300'
              : 'border-rose-800 bg-rose-500/5 text-rose-300'
          }`}
        >
          policy: fail {step.policy}
        </p>
      )}

      <div className="mt-3 space-y-1">
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">round-trips this step</span>
          <span className="text-slate-300">{step.redisOps}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">round-trips total</span>
          <span className="text-slate-300">{step.totalOps}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px]">
          <span className="text-slate-600">tick</span>
          <span className="text-slate-300">t={step.tick}</span>
        </div>
      </div>

      {down && (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          The limiter cannot read anyone&apos;s balance. It is not slow and it is not wrong — it is
          blind, and it still has to return something.
        </p>
      )}
    </div>
  )
}

// ─── Verdict panel ───────────────────────────────────────────────────────────

function VerdictPanel({ step }: { step: TokenBucketV2Step }) {
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
      <p className="font-mono text-[11px] text-slate-300">{verdict.bucket}</p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.sliding}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{verdict.note}</p>
    </div>
  )
}

// ─── Code panel ──────────────────────────────────────────────────────────────

function CodePanel({ step }: { step: TokenBucketV2Step }) {
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
              i === step.codeLine
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'text-slate-500'
            }`}
          >
            {line || ' '}
          </pre>
        ))}
      </div>
    </div>
  )
}

// ─── Event log ───────────────────────────────────────────────────────────────

const LOG_COLORS: Record<LogKind, string> = {
  allow: 'text-emerald-400',
  deny: 'text-rose-400',
  refill: 'text-sky-400',
  outage: 'text-rose-300',
  policy: 'text-amber-300',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: TokenBucketV2Step }) {
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

function TokenBucketV2View({
  step,
  mode,
  onMode,
}: {
  step: TokenBucketV2Step
  mode: TokenBucketV2Mode
  onMode: (mode: TokenBucketV2Mode) => void
}) {
  return (
    <div className="w-full space-y-4">
      {/* Mode toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">strategy</span>
        {(Object.keys(MODE_LABELS) as TokenBucketV2Mode[]).map(m => (
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

      {/* Banners */}
      {step.redis === 'down' && !step.policy && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          the store the limiter depends on is gone — the next line of code decides what a rate
          limiter means when it cannot count
        </p>
      )}
      {step.policy === 'open' && (
        <p className="border border-amber-800 bg-amber-500/5 px-3 py-2 font-mono text-[11px] text-amber-300">
          failing open — the API is up and the limit is not being enforced
        </p>
      )}
      {step.policy === 'closed' && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          failing closed — the limit holds and well-behaved clients are being turned away
        </p>
      )}

      {/* Clients */}
      <div className="grid items-stretch gap-3 md:grid-cols-3">
        {step.clients.map(c => (
          <ClientCard key={c.id} client={c} step={step} />
        ))}
      </div>

      {/* Panels */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <CodePanel step={step} />
        <div className="space-y-4">
          <StorePanel step={step} />
          <VerdictPanel step={step} />
        </div>
        <div className="space-y-4">
          <EventLog step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              the bucket was never the hard part
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Day 42 built the bucket and stopped there, because the bucket is the part that looks
              like the algorithm. Everything expensive is downstream of it: where the count lives,
              what it costs to read, and which way it fails when the place it lives stops
              answering.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TokenBucketV2() {
  const [mode, setMode] = useState<TokenBucketV2Mode>('bucket')
  const steps = useMemo(() => collectSteps(tokenBucketV2Steps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <TokenBucketV2View step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
