import { useMemo } from 'react'
import { BSTView } from '../../components/bst-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { bstSteps } from './binary-search-tree.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'current' },
  { color: 'bg-sky-900', label: 'path' },
  { color: 'bg-amber-500', label: 'successor' },
]

export function BinarySearchTree() {
  const steps = useMemo(() => collectSteps(bstSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <BSTView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
