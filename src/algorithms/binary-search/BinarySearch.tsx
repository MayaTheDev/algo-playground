import { useState, useMemo } from 'react'
import { SearchBlocks } from '../../components/SearchBlocks'
import { Controls } from '../../components/Controls'
import { useAlgoPlayer } from '../../hooks/useAlgoPlayer'
import { generateSortedArray, collectSteps } from '../../utils/array.utils'
import { binarySearchSteps } from './binary-search.logic'

function pickTarget(arr: number[]): number {
  // 70% chance of picking a value that exists
  if (Math.random() < 0.7) {
    return arr[Math.floor(Math.random() * arr.length)]
  }
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
          <SearchBlocks step={player.currentStep} />
          <div className="mt-4 flex gap-3 justify-center text-[10px] text-slate-600">
            <span><span className="inline-block w-2 h-2 bg-cyan-500 mr-1" />midpoint</span>
            <span><span className="inline-block w-2 h-2 bg-slate-600 mr-1" />active range</span>
            <span><span className="inline-block w-2 h-2 bg-slate-800 mr-1" />eliminated</span>
            <span><span className="inline-block w-2 h-2 bg-emerald-500 mr-1" />found</span>
          </div>
        </div>
      </div>
      <Controls player={player} onNewInput={handleNewInput} />
    </div>
  )
}
