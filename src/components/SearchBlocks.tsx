import type { SearchStep } from '../types/algo.types'

type Props = {
  step: SearchStep
}

export function SearchBlocks({ step }: Props) {
  const { array, left, right, mid, found, eliminated } = step
  const eliminatedSet = new Set(eliminated)

  return (
    <div className="w-full px-2">
      <div className="flex flex-wrap gap-1 justify-center">
        {array.map((val, i) => {
          const isEliminated = eliminatedSet.has(i)
          const isMid = i === mid && found === null
          const isFound = i === found
          const inRange = i >= left && i <= right && left !== -1

          const bg = isFound
            ? 'bg-emerald-500 neon-text ring-2 ring-emerald-400'
            : isMid
              ? 'bg-cyan-500'
              : isEliminated
                ? 'bg-slate-800 text-slate-600'
                : inRange
                  ? 'bg-slate-600'
                  : 'bg-slate-700 text-slate-500'

          return (
            <div
              key={i}
              className={`w-10 h-10 flex items-center justify-center text-xs font-mono rounded transition-all duration-150 ${bg}`}
            >
              {val}
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-xs text-slate-400 font-mono flex gap-4 justify-center">
        <span>target: <span className="text-emerald-400">{step.target}</span></span>
        {left !== -1 && <span>left: <span className="text-amber-400">{left}</span></span>}
        {right !== -1 && <span>right: <span className="text-amber-400">{right}</span></span>}
        {mid !== -1 && found === null && <span>mid: <span className="text-cyan-400">{mid}</span></span>}
        {found !== null && found >= 0 && (
          <span className="text-emerald-400">found at index {found}</span>
        )}
        {found === -1 && <span className="text-red-400">not found</span>}
      </div>
    </div>
  )
}
