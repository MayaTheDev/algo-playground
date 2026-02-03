import { useState, useMemo } from 'react'
import { SortBars } from '../../components/SortBars'
import { Controls } from '../../components/Controls'
import { useAlgoPlayer } from '../../hooks/useAlgoPlayer'
import { generateRandomArray, collectSteps } from '../../utils/array.utils'
import { bubbleSortSteps } from './bubble-sort.logic'

const LEGEND = [
  { color: 'bg-amber-400', label: 'comparing' },
  { color: 'bg-emerald-500', label: 'sorted' },
]

export function BubbleSort() {
  const [input, setInput] = useState(() => generateRandomArray(16))
  const steps = useMemo(() => collectSteps(bubbleSortSteps(input)), [input])
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
