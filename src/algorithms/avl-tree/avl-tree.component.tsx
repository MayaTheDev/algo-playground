import { useMemo } from 'react'
import { BSTView } from '../../components/bst-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { avlTreeSteps } from './avl-tree.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'active node' },
  { color: 'bg-sky-900', label: 'path / rebalanced subtree' },
]

export function AvlTree() {
  const steps = useMemo(() => collectSteps(avlTreeSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        <BSTView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
