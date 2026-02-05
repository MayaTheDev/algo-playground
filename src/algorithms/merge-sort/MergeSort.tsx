import { useState, useMemo } from 'react'
import { SortBars } from '../../components/SortBars'
import { Controls } from '../../components/Controls'
import { useAlgoPlayer } from '../../hooks/useAlgoPlayer'
import { generateRandomArray, collectSteps } from '../../utils/array.utils'
import { mergeSortSteps } from './merge-sort.logic'

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
          <div className="mt-2 flex gap-3 justify-center text-[10px] text-slate-600">
            <span><span className="inline-block w-2 h-2 bg-emerald-500 mr-1" />sorted</span>
            <span><span className="inline-block w-2 h-2 bg-amber-400 mr-1" />comparing</span>
            <span><span className="inline-block w-2 h-2 bg-cyan-500/60 mr-1" />merging</span>
          </div>
        </div>
      </div>
      <Controls player={player} onNewInput={handleNewInput} />
    </div>
  )
}
