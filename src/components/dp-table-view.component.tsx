import type { DpStep } from '../types/algo.types'

type Props = { step: DpStep }

export function DpTableView({ step }: Props) {
  const { table, current, comparing, filled, coins } = step

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-3 text-center">
        <span className="text-xs text-slate-500 font-mono">coins: </span>
        <span className="text-sm font-mono text-emerald-400">[{coins.join(', ')}]</span>
      </div>
      <div className="flex flex-wrap gap-1 justify-center">
        {table.map((val, i) => {
          const isCurrent = i === current
          const isComparing = comparing && (comparing[0] === i || comparing[1] === i)
          const isFilled = filled.includes(i) && val !== Infinity

          let bg = 'bg-slate-800'
          let text = 'text-slate-600'
          let border = 'border-slate-700'

          if (isCurrent) {
            bg = 'bg-emerald-500/20'
            text = 'text-emerald-400'
            border = 'border-emerald-500'
          } else if (isComparing) {
            bg = 'bg-amber-500/10'
            text = 'text-amber-400'
            border = 'border-amber-600'
          } else if (isFilled) {
            bg = 'bg-emerald-900/30'
            text = 'text-emerald-300'
            border = 'border-emerald-800'
          }

          return (
            <div key={i} className={`flex flex-col items-center border ${border} ${bg} w-10 py-1 rounded`}>
              <span className="text-[9px] text-slate-500 font-mono">{i}</span>
              <span className={`text-xs font-mono ${text}`}>
                {val === Infinity ? '∞' : val}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
