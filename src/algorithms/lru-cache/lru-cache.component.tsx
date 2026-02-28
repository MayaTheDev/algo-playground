import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { lruCacheSteps, type LruStep } from './lru-cache.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'current key' },
  { color: 'bg-amber-400', label: 'evicted key' },
]

function LruCacheView({ step }: { step: LruStep }) {
  return (
    <div className="w-full max-w-4xl space-y-5">
      <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-slate-600">recency list</p>
          <span className="font-mono text-xs text-slate-500">MRU → LRU</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {step.order.map((key, index) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className={`border px-4 py-3 font-mono text-sm ${
                  key === step.currentKey
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : key === step.evicted
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                }`}
              >
                {key}:{step.values[key]}
              </div>
              {index < step.order.length - 1 && <span className="text-slate-600">→</span>}
            </div>
          ))}
          {step.order.length === 0 && <span className="font-mono text-xs text-slate-600">empty cache</span>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-600">hash map</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(step.values).map(([key, value]) => (
              <div
                key={key}
                className={`rounded border p-3 font-mono text-sm ${
                  key === step.currentKey ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-slate-900 text-slate-300'
                }`}
              >
                {key} → {value}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-slate-950/40 p-4 font-mono text-sm text-slate-300">
          <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-600">capacity</p>
          <div>{step.order.length}/{step.capacity} slots in use</div>
          <div className="mt-3">
            Evicted:
            <span className={step.evicted ? 'ml-2 text-amber-300' : 'ml-2 text-slate-600'}>
              {step.evicted ?? 'none'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LruCache() {
  const steps = useMemo(() => collectSteps(lruCacheSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        <LruCacheView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
