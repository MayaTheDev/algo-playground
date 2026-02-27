import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { tokenBucketSteps, type TokenBucketStep } from './token-bucket.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'allowed request' },
  { color: 'bg-amber-400', label: 'denied request' },
  { color: 'bg-sky-400', label: 'refill tick' },
]

function TokenBucketView({ step }: { step: TokenBucketStep }) {
  return (
    <div className="w-full max-w-3xl space-y-5">
      <div className="rounded border border-slate-800 bg-slate-950/40 p-5">
        <div className="mb-4 flex items-center justify-between font-mono text-sm">
          <span className="text-slate-400">time = {step.time}s</span>
          <span className="text-emerald-300">
            {step.tokens}/{step.capacity} tokens
          </span>
        </div>

        <div className="mx-auto flex max-w-xs flex-col-reverse gap-2">
          {Array.from({ length: step.capacity }, (_, index) => {
            const filled = index < step.tokens
            return (
              <div
                key={index}
                className={`h-10 rounded border ${
                  filled ? 'border-emerald-500 bg-emerald-500/15' : 'border-slate-800 bg-slate-900'
                }`}
              />
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">current action</div>
          <div className="font-mono text-sm text-slate-300">{step.action}</div>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">refill rate</div>
          <div className="font-mono text-sm text-slate-300">{step.refillRate} token / sec</div>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">request result</div>
          <div
            className={`font-mono text-sm ${
              step.allowed === null ? 'text-slate-400' : step.allowed ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {step.allowed === null ? '—' : step.allowed ? 'allowed' : 'denied'}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TokenBucket() {
  const steps = useMemo(() => collectSteps(tokenBucketSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        <TokenBucketView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
