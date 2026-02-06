import { useState, useMemo } from 'react'
import { SortBars } from './SortBars'
import { useComparePlayer } from '../hooks/useComparePlayer'
import { generateRandomArray, collectSteps } from '../utils/array.utils'
import { bubbleSortSteps } from '../algorithms/bubble-sort/bubble-sort.logic'
import { mergeSortSteps } from '../algorithms/merge-sort/merge-sort.logic'
import { insertionSortSteps } from '../algorithms/insertion-sort/insertion-sort.logic'
import { selectionSortSteps } from '../algorithms/selection-sort/selection-sort.logic'
import type { SortAlgoId } from '../types/algo.types'

const SORT_FNS = {
  'bubble-sort': bubbleSortSteps,
  'merge-sort': mergeSortSteps,
  'insertion-sort': insertionSortSteps,
  'selection-sort': selectionSortSteps,
}

const LABELS: Record<SortAlgoId, string> = {
  'bubble-sort': 'Bubble Sort',
  'merge-sort': 'Merge Sort',
  'insertion-sort': 'Insertion Sort',
  'selection-sort': 'Selection Sort',
}

const COMPLEXITY: Record<SortAlgoId, string> = {
  'bubble-sort': 'O(n²)',
  'merge-sort': 'O(n log n)',
  'insertion-sort': 'O(n²)',
  'selection-sort': 'O(n²)',
}

const ALGO_IDS = Object.keys(SORT_FNS) as SortAlgoId[]

const SPEED_OPTIONS = [
  { label: '0.5×', value: 800 },
  { label: '1×', value: 400 },
  { label: '2×', value: 200 },
  { label: '4×', value: 80 },
]

export function CompareView() {
  const [leftAlgo, setLeftAlgo] = useState<SortAlgoId>('bubble-sort')
  const [rightAlgo, setRightAlgo] = useState<SortAlgoId>('merge-sort')
  const [input, setInput] = useState(() => generateRandomArray(16))

  const stepsA = useMemo(() => collectSteps(SORT_FNS[leftAlgo](input)), [leftAlgo, input])
  const stepsB = useMemo(() => collectSteps(SORT_FNS[rightAlgo](input)), [rightAlgo, input])

  const player = useComparePlayer(stepsA, stepsB)

  const handleNewInput = () => {
    player.reset()
    setInput(generateRandomArray(16))
  }

  const handleAlgoChange = (side: 'left' | 'right', algo: SortAlgoId) => {
    player.reset()
    if (side === 'left') setLeftAlgo(algo)
    else setRightAlgo(algo)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Side-by-side visualizers */}
      <div className="flex-1 flex gap-px min-h-0 overflow-hidden">
        {/* Left */}
        <div className="flex-1 flex flex-col p-4 gap-2 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <select
              value={leftAlgo}
              onChange={e => handleAlgoChange('left', e.target.value as SortAlgoId)}
              className="bg-[#020617] text-xs font-mono text-slate-200 border border-slate-700 px-2 py-1 focus:outline-none focus:border-emerald-600"
            >
              {ALGO_IDS.map(id => (
                <option key={id} value={id}>{LABELS[id]}</option>
              ))}
            </select>
            <span className="text-xs text-emerald-500 font-mono">{COMPLEXITY[leftAlgo]}</span>
            {player.doneA && (
              <span className="text-[10px] text-emerald-400 font-mono">✓ {player.totalA} steps</span>
            )}
          </div>
          <div className="flex-1 flex items-end min-h-0">
            <SortBars step={player.stepA} />
          </div>
          <p className="text-[10px] text-slate-500 font-mono min-h-[14px] truncate">
            {player.stepA.description}
          </p>
          <div className="h-[2px] bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-100"
              style={{ width: `${player.totalA > 1 ? (player.idxA / (player.totalA - 1)) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-600 font-mono">
            step {player.idxA + 1} / {player.totalA}
          </p>
        </div>

        {/* Divider */}
        <div className="w-px bg-slate-800 shrink-0" />

        {/* Right */}
        <div className="flex-1 flex flex-col p-4 gap-2 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <select
              value={rightAlgo}
              onChange={e => handleAlgoChange('right', e.target.value as SortAlgoId)}
              className="bg-[#020617] text-xs font-mono text-slate-200 border border-slate-700 px-2 py-1 focus:outline-none focus:border-emerald-600"
            >
              {ALGO_IDS.map(id => (
                <option key={id} value={id}>{LABELS[id]}</option>
              ))}
            </select>
            <span className="text-xs text-emerald-500 font-mono">{COMPLEXITY[rightAlgo]}</span>
            {player.doneB && (
              <span className="text-[10px] text-emerald-400 font-mono">✓ {player.totalB} steps</span>
            )}
          </div>
          <div className="flex-1 flex items-end min-h-0">
            <SortBars step={player.stepB} />
          </div>
          <p className="text-[10px] text-slate-500 font-mono min-h-[14px] truncate">
            {player.stepB.description}
          </p>
          <div className="h-[2px] bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-100"
              style={{ width: `${player.totalB > 1 ? (player.idxB / (player.totalB - 1)) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-600 font-mono">
            step {player.idxB + 1} / {player.totalB}
          </p>
        </div>
      </div>

      {/* Shared controls */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-800 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={player.reset}
            className="px-3 py-1 text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
          >
            reset
          </button>
          {player.playing ? (
            <button
              onClick={player.pause}
              className="px-4 py-1 text-xs border border-amber-600 text-amber-400 hover:bg-amber-600/10 transition-colors"
            >
              pause
            </button>
          ) : (
            <button
              onClick={player.isDone ? player.reset : player.play}
              className="px-4 py-1 text-xs border border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 transition-colors"
            >
              {player.isDone ? 'restart' : 'play'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {SPEED_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => player.setSpeed(opt.value)}
                className={`px-2 py-0.5 text-xs transition-colors ${
                  player.speed === opt.value
                    ? 'border border-emerald-600 text-emerald-400'
                    : 'border border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleNewInput}
            className="px-3 py-1 text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
          >
            new input
          </button>
        </div>
      </div>
    </div>
  )
}
