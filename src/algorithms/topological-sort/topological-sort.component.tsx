import { useMemo } from 'react'
import { TopoView } from '../../components/topo-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { topologicalSortSteps } from './topological-sort.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'current' },
  { color: 'bg-sky-900', label: 'in queue' },
  { color: 'bg-emerald-900', label: 'sorted' },
]

export function TopologicalSort() {
  const steps = useMemo(() => collectSteps(topologicalSortSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <TopoView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
