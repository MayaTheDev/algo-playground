import type { SortStep } from '../types/algo.types'

type Props = {
  step: SortStep
}

export function SortBars({ step }: Props) {
  const { array, comparing, sorted, activeRange } = step
  const max = Math.max(...array)
  const sortedSet = new Set(sorted)
  const [c0, c1] = comparing ?? [-1, -1]
  const [rangeLeft, rangeRight] = activeRange ?? [-1, -1]

  return (
    <div className="flex items-end gap-[2px] h-52 w-full px-2">
      {array.map((val, i) => {
        const isComparing = i === c0 || i === c1
        const isSorted = sortedSet.has(i)
        const inActiveRange = activeRange !== null && i >= rangeLeft && i < rangeRight

        const color = isSorted
          ? 'bg-emerald-500'
          : isComparing
            ? 'bg-amber-400'
            : inActiveRange
              ? 'bg-cyan-500/60'
              : 'bg-slate-600'

        return (
          <div
            key={i}
            className={`flex-1 rounded-t-sm transition-all duration-75 ${color}`}
            style={{ height: `${(val / max) * 100}%` }}
          />
        )
      })}
    </div>
  )
}
