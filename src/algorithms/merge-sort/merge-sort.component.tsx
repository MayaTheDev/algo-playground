import { useState, useMemo } from 'react'
import { SortBars } from '../../components/sort-bars.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { generateRandomArray, collectSteps } from '../../utils/array.utils'
import { mergeSortSteps } from './merge-sort.logic'

const LEGEND = [
  { color: 'bg-amber-400', label: 'comparing' },
  { color: 'bg-cyan-500/60', label: 'merging' },
  { color: 'bg-emerald-500', label: 'sorted' },
]

export function MergeSort() {
  const [input, setInput] = useState(() => generateRandomArray(16))
  const steps = useMemo(() => collectSteps(mergeSortSteps(input)), [input])
  const player = useAlgoPlayer(steps)

  const handleNewInput = () => {
    player.reset()
    setInput(generateRandomArray(16))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <SortBars step={player.currentStep} />
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
