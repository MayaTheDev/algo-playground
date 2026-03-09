import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { lruCacheSteps, type LruStep } from './lru-cache.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'active key' },
  { color: 'bg-amber-400', label: 'evicted key' },
  { color: 'bg-sky-400', label: 'linked-list pointer' },
]

type Prediction = {
  choice: string
  correct: boolean
} | null

type Challenge = {
  options: string[]
  answer: string | null
}

function hitRate(step: LruStep): number {
  const attempts = step.stats.hits + step.stats.misses
  return attempts === 0 ? 0 : Math.round((step.stats.hits / attempts) * 100)
}

function formatOperation(step: LruStep): string {
  return step.operation?.label ?? 'LRU interview warmup'
}

function getChallenge(step: LruStep): Challenge {
  if (step.result === 'evict') {
    return { options: step.beforeOrder, answer: step.evicted }
  }

  if (step.result === 'miss') {
    return { options: ['hit', 'miss'], answer: 'miss' }
  }

  if (step.result === 'hit' || step.result === 'update') {
    return { options: ['map lookup only', 'promote to head', 'scan all keys'], answer: 'promote to head' }
  }

  return { options: ['append to tail', 'insert at head', 'scan all keys'], answer: 'insert at head' }
}

function RecencyList({
  title,
  order,
  values,
  currentKey,
  evicted,
}: {
  title: string
  order: string[]
  values: Record<string, number>
  currentKey: string | null
  evicted: string | null
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{title}</p>
        <span className="font-mono text-xs text-slate-500">MRU -&gt; LRU</span>
      </div>
      <div className="flex min-h-12 flex-wrap items-center gap-2">
        {order.map((key, index) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className={`border px-4 py-3 font-mono text-sm ${
                key === currentKey
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                  : key === evicted
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300'
              }`}
            >
              {key}:{values[key]}
            </div>
            {index < order.length - 1 && <span className="text-slate-600">-&gt;</span>}
          </div>
        ))}
        {order.length === 0 && <span className="font-mono text-xs text-slate-600">empty cache</span>}
      </div>
    </div>
  )
}

function StatsPanel({ step }: { step: LruStep }) {
  const rate = hitRate(step)
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {[
        ['hits', step.stats.hits, 'text-emerald-300'],
        ['misses', step.stats.misses, 'text-rose-300'],
        ['evictions', step.stats.evictions, 'text-amber-300'],
        ['hit rate', `${rate}%`, 'text-sky-300'],
      ].map(([label, value, color]) => (
        <div key={label} className="border border-slate-800 bg-slate-950/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{label}</p>
          <p className={`mt-1 font-mono text-lg ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}

function HashMapPanel({ step }: { step: LruStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-slate-600">hash map</p>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(step.values).map(([key, value]) => (
          <div
            key={key}
            className={`rounded border p-3 font-mono text-sm ${
              key === step.currentKey
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-300'
            }`}
          >
            {key} -&gt; node({value})
          </div>
        ))}
        {Object.keys(step.values).length === 0 && (
          <span className="font-mono text-xs text-slate-600">no pointers yet</span>
        )}
      </div>
    </div>
  )
}

function PointerPanel({ step }: { step: LruStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-slate-600">doubly-linked list</p>
      <div className="space-y-2">
        {step.nodes.map((node) => (
          <div
            key={node.key}
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded border p-2 font-mono text-xs ${
              node.key === step.currentKey
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-300'
            }`}
          >
            <span className="text-right text-sky-400">{node.prev ?? 'HEAD'}</span>
            <span className="border border-slate-700 px-3 py-1">{node.key}</span>
            <span className="text-sky-400">{node.next ?? 'TAIL'}</span>
          </div>
        ))}
        {step.nodes.length === 0 && <span className="font-mono text-xs text-slate-600">no nodes linked</span>}
      </div>
    </div>
  )
}

function InterviewCard({
  step,
  prediction,
  onPredict,
}: {
  step: LruStep
  prediction: Prediction
  onPredict: (choice: string) => void
}) {
  const { options, answer } = getChallenge(step)

  if (step.operation === null) {
    return (
      <div className="rounded border border-emerald-800 bg-emerald-950/20 p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">interview prompt</p>
        <p className="mt-2 font-mono text-sm text-emerald-200">{step.interviewPrompt}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Answer: hash map for O(1) addressability, doubly-linked list for O(1) recency mutation.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">interview prompt</p>
          <p className="mt-1 font-mono text-sm text-slate-200">{step.interviewPrompt}</p>
        </div>
        <span className="border border-slate-700 px-2 py-1 font-mono text-xs text-slate-400">
          {formatOperation(step)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = prediction?.choice === option
          const showResult = prediction !== null && selected
          return (
            <button
              key={option}
              onClick={() => onPredict(option)}
              className={`border px-3 py-2 font-mono text-xs transition-colors ${
                showResult
                  ? prediction.correct
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500 bg-rose-500/10 text-rose-300'
                  : 'border-slate-700 text-slate-300 hover:border-emerald-600 hover:text-emerald-300'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>

      {prediction && (
        <p className={`mt-3 font-mono text-xs ${prediction.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
          {prediction.correct ? 'Correct.' : `Not quite. The answer is ${answer}.`}
        </p>
      )}
    </div>
  )
}

function TradeoffPanel({ step }: { step: LruStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">system-design follow-up</p>
      <h3 className="mt-2 font-mono text-sm text-amber-300">{step.tradeoff.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{step.tradeoff.body}</p>
    </div>
  )
}

function LruCacheView({
  step,
  prediction,
  onPredict,
}: {
  step: LruStep
  prediction: Prediction
  onPredict: (choice: string) => void
}) {
  return (
    <div className="w-full max-w-5xl space-y-4">
      <StatsPanel step={step} />

      <InterviewCard step={step} prediction={prediction} onPredict={onPredict} />

      <div className="grid gap-4 xl:grid-cols-2">
        <RecencyList
          title="before operation"
          order={step.beforeOrder}
          values={step.beforeValues}
          currentKey={null}
          evicted={step.evicted}
        />
        <RecencyList
          title="after operation"
          order={step.order}
          values={step.values}
          currentKey={step.currentKey}
          evicted={step.evicted}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
        <HashMapPanel step={step} />
        <PointerPanel step={step} />
        <TradeoffPanel step={step} />
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/40 p-4 font-mono text-xs text-slate-400">
        <span className="text-slate-600">capacity</span>{' '}
        <span className="text-slate-200">{step.order.length}/{step.capacity}</span>
        <span className="mx-3 text-slate-700">|</span>
        <span className="text-slate-600">result</span>{' '}
        <span className="text-emerald-300">{step.result}</span>
        <span className="mx-3 text-slate-700">|</span>
        <span className="text-slate-600">evicted</span>{' '}
        <span className={step.evicted ? 'text-amber-300' : 'text-slate-600'}>{step.evicted ?? 'none'}</span>
      </div>
    </div>
  )
}

export function LruCache() {
  const steps = useMemo(() => collectSteps(lruCacheSteps()), [])
  const player = useAlgoPlayer(steps)
  const [prediction, setPrediction] = useState<Prediction>(null)

  useEffect(() => {
    setPrediction(null)
  }, [player.idx])

  const handlePredict = (choice: string) => {
    const { answer } = getChallenge(player.currentStep)
    setPrediction({ choice, correct: choice === answer })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <LruCacheView step={player.currentStep} prediction={prediction} onPredict={handlePredict} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
