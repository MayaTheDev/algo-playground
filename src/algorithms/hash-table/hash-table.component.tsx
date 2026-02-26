import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { hashTableSteps, type HashTableStep } from './hash-table.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'current key' },
  { color: 'bg-amber-400', label: 'probe slot' },
]

function HashTableView({ step }: { step: HashTableStep }) {
  return (
    <div className="w-full max-w-4xl space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-600">chaining</p>
          <div className="space-y-2">
            {step.chaining.map((bucket, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 font-mono text-xs text-slate-500">[{index}]</div>
                <div className="flex min-h-12 flex-1 flex-wrap gap-2 rounded border border-slate-800 bg-slate-900 p-2">
                  {bucket.length === 0 ? (
                    <span className="font-mono text-xs text-slate-700">empty</span>
                  ) : (
                    bucket.map((key) => (
                      <span
                        key={key}
                        className={`border px-2 py-1 font-mono text-xs ${
                          key === step.key ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 text-slate-300'
                        }`}
                      >
                        {key}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-600">open addressing</p>
          <div className="grid grid-cols-2 gap-3">
            {step.probing.map((value, index) => (
              <div
                key={index}
                className={`rounded border p-3 font-mono text-sm ${
                  step.probeIndex === index
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300'
                }`}
              >
                <div className="mb-1 text-[10px] text-slate-500">slot {index}</div>
                <div>{value ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/40 p-4 font-mono text-sm text-slate-300">
        <span className="text-slate-500">hash(key)</span>
        <span className="ml-2 text-emerald-300">
          {step.key && step.hash !== null ? `hash("${step.key}") = ${step.hash}` : 'waiting for insertion'}
        </span>
      </div>
    </div>
  )
}

export function HashTable() {
  const steps = useMemo(() => collectSteps(hashTableSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        <HashTableView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
