import { useMemo } from 'react'
import { AStarGridView } from '../../components/astar-grid-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { aStarSteps } from './a-star.logic'

const LEGEND = [
  { color: 'bg-sky-400', label: 'start' },
  { color: 'bg-amber-500', label: 'end' },
  { color: 'bg-emerald-900', label: 'open set' },
  { color: 'bg-indigo-900', label: 'closed' },
  { color: 'bg-emerald-400', label: 'path' },
]

export function AStar() {
  const steps = useMemo(() => collectSteps(aStarSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <AStarGridView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
