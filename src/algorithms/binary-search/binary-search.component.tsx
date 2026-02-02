import { useState, useMemo } from 'react'
import { SearchBlocks } from '../../components/search-blocks.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { generateSortedArray, collectSteps } from '../../utils/array.utils'
import { binarySearchSteps } from './binary-search.logic'

const LEGEND = [
  { color: 'bg-cyan-500', label: 'midpoint' },
  { color: 'bg-slate-600', label: 'active range' },
  { color: 'bg-slate-800', label: 'eliminated' },
  { color: 'bg-emerald-500', label: 'found' },
]

function pickTarget(arr: number[]): number {
  if (Math.random() < 0.7) return arr[Math.floor(Math.random() * arr.length)]
  return Math.floor(Math.random() * 90) + 10
}

export function BinarySearch() {
  const [state, setState] = useState(() => {
    const arr = generateSortedArray(20)
    return { arr, target: pickTarget(arr) }
  })

  const steps = useMemo(
    () => collectSteps(binarySearchSteps(state.arr, state.target)),
    [state],
  )
  const player = useAlgoPlayer(steps)

  const handleNewInput = () => {
    player.reset()
    const arr = generateSortedArray(20)
    setState({ arr, target: pickTarget(arr) })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-4 text-center">
            <span className="text-xs text-slate-500 font-mono">searching for </span>
            <span className="text-lg font-mono text-emerald-400">{state.target}</span>
          </div>
          <SearchBlocks step={player.currentStep} />
        </div>
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
        onNewInput={handleNewInput}
      />
    </div>
  )
}
