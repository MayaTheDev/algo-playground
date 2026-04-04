import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  CODE,
  INSERTED,
  K,
  MODE_LABELS,
  bloomFilterSteps,
  type BloomMode,
  type BloomStep,
  type LogKind,
  type QueryVerdict,
} from './bloom-filter.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'bit set by this word' },
  { color: 'bg-rose-400', label: 'collision — already 1' },
  { color: 'bg-sky-600', label: 'set by an earlier word' },
  { color: 'bg-slate-800', label: 'still 0' },
]

const VERDICT_STYLE: Record<QueryVerdict, { label: string; cls: string; border: string }> = {
  'definitely-not': {
    label: 'definitely not in the set',
    cls: 'text-sky-300',
    border: 'border-sky-800 bg-sky-500/5',
  },
  probably: {
    label: 'probably in the set — and it is',
    cls: 'text-emerald-300',
    border: 'border-emerald-800 bg-emerald-500/5',
  },
  'false-positive': {
    label: 'probably in the set — but it never was',
    cls: 'text-rose-300',
    border: 'border-rose-800 bg-rose-500/5',
  },
}

function BitArray({ step }: { step: BloomStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">
          bit array · {step.m} bits · {K} hashes per word
        </p>
        <p className="font-mono text-[10px] text-slate-500">
          {step.bitsSet}/{step.m} set · {Math.round((step.bitsSet / step.m) * 100)}% full
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {step.bits.map((b, i) => {
          const isActive = step.active.includes(i)
          const isCollision = step.collisions.includes(i)
          const isDeciding = step.decidingBit === i
          const cls = isDeciding
            ? 'border-sky-400 bg-sky-500/30 text-sky-200'
            : isCollision
              ? 'border-rose-600 bg-rose-500/30 text-rose-200'
              : isActive
                ? b
                  ? 'border-emerald-600 bg-emerald-500/30 text-emerald-200'
                  : 'border-slate-600 bg-slate-800 text-slate-400'
                : b
                  ? 'border-sky-900 bg-sky-600/30 text-sky-300'
                  : 'border-slate-800 bg-slate-900 text-slate-700'
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-sm border font-mono text-[11px] transition-colors ${cls}`}
              >
                {b}
              </div>
              <span className="font-mono text-[8px] text-slate-700">{i}</span>
            </div>
          )
        })}
      </div>

      {step.word && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-slate-500">
            {step.phase === 'query' ? 'has' : 'add'}(
          </span>
          <span className="font-mono text-[12px] text-amber-300">&quot;{step.word}&quot;</span>
          <span className="font-mono text-[11px] text-slate-500">
            ) → {step.active.join(', ')}
          </span>
          {step.verdictForWord && (
            <span
              className={`rounded border px-2 py-0.5 font-mono text-[10px] ${VERDICT_STYLE[step.verdictForWord].border} ${VERDICT_STYLE[step.verdictForWord].cls}`}
            >
              {VERDICT_STYLE[step.verdictForWord].label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function SizeTable({ step }: { step: BloomStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
        same words, same hashes, different m
      </p>
      {step.sizes.length === 0 ? (
        <p className="font-mono text-[11px] text-slate-700">run to measure</p>
      ) : (
        <table className="w-full">
          <tbody>
            <tr className="text-left font-mono text-[9px] uppercase tracking-widest text-slate-600">
              <th className="pb-1 font-normal">bits</th>
              <th className="pb-1 font-normal">full</th>
              <th className="pb-1 font-normal">false yes</th>
              <th className="pb-1 font-normal">rate</th>
              <th className="pb-1 font-normal">&quot;maybe&quot;</th>
            </tr>
            {step.sizes.map(r => {
              const pct = Math.round((r.falsePositives / r.probed) * 100)
              return (
                <tr key={r.m} className="font-mono text-[11px]">
                  <td className="py-0.5 text-slate-300">{r.m}</td>
                  <td className="py-0.5 text-slate-500">{Math.round(r.load * 100)}%</td>
                  <td className="py-0.5 text-slate-400">
                    {r.falsePositives}/{r.probed}
                  </td>
                  <td
                    className={`py-0.5 ${pct === 0 ? 'text-emerald-400' : pct > 25 ? 'text-rose-400' : 'text-amber-300'}`}
                  >
                    {pct}%
                  </td>
                  <td
                    className={`py-0.5 ${r.maybeFalse ? 'text-rose-400' : 'text-emerald-400'}`}
                  >
                    {r.maybeFalse ? 'lies' : 'correct'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ContentsPanel({ step }: { step: BloomStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
        what went in (the filter does not know this)
      </p>
      <div className="flex flex-wrap gap-1">
        {INSERTED.map(w => (
          <span
            key={w}
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
              step.word === w
                ? 'border-amber-600 bg-amber-500/10 text-amber-300'
                : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}
          >
            {w}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        This list lives in the demo, not in the structure. The filter holds {step.m} bits and no
        words at all — which is why it is small, why it cannot enumerate itself, and why nothing can
        ever be deleted from it.
      </p>
    </div>
  )
}

function VerdictPanel({ step }: { step: BloomStep }) {
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
      <p className="font-mono text-[11px] text-slate-300">{verdict.headline}</p>
      <p className="font-mono text-[11px] text-slate-300">{verdict.detail}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{verdict.note}</p>
    </div>
  )
}

function CodePanel({ step }: { step: BloomStep }) {
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
  insert: 'text-emerald-400',
  collide: 'text-rose-300',
  hit: 'text-emerald-300',
  miss: 'text-sky-400',
  false: 'text-rose-400',
  note: 'text-slate-500',
}

function EventLog({ step }: { step: BloomStep }) {
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

function BloomView({
  step,
  mode,
  onMode,
}: {
  step: BloomStep
  mode: BloomMode
  onMode: (m: BloomMode) => void
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">view</span>
        {(Object.keys(MODE_LABELS) as BloomMode[]).map(m => (
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

      {step.verdictForWord === 'false-positive' && (
        <p className="border border-rose-800 bg-rose-500/5 px-3 py-2 font-mono text-[11px] text-rose-300">
          this is a false positive — the implementation is correct and the answer is wrong
        </p>
      )}

      {step.verdictForWord === 'definitely-not' && (
        <p className="border border-sky-800 bg-sky-500/5 px-3 py-2 font-mono text-[11px] text-sky-300">
          one zero bit ends the question — a Bloom filter has no false negatives
        </p>
      )}

      {mode === 'tradeoff' ? <SizeTable step={step} /> : <BitArray step={step} />}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <CodePanel step={step} />
        <div className="space-y-4">
          {mode !== 'tradeoff' && <ContentsPanel step={step} />}
          <VerdictPanel step={step} />
        </div>
        <div className="space-y-4">
          <EventLog step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              where this actually sits
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              A Bloom filter goes in front of the expensive thing — the disk read, the network call,
              the database lookup. &quot;No&quot; is certain, so it short-circuits with total
              confidence. &quot;Yes&quot; means go and check properly. It is not a cache and it does
              not store your data; it is a cheap way of being sure about absence. Cassandra, HBase
              and Chrome&apos;s old safe-browsing list all ran on exactly this trade.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BloomFilter() {
  const [mode, setMode] = useState<BloomMode>('build')
  const steps = useMemo(() => collectSteps(bloomFilterSteps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <BloomView step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
