import { useMemo } from 'react'
import { WeightedGraphView } from '../../components/weighted-graph-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { dijkstraSteps, generateWeightedGraph } from './dijkstra.logic'

const LEGEND = [
  { color: 'bg-amber-500', label: 'current' },
  { color: 'bg-amber-900', label: 'finalized' },
  { color: 'bg-sky-400', label: 'in queue' },
]

export function Dijkstra() {
  const graph = useMemo(() => generateWeightedGraph(), [])

  const steps = useMemo(
    () => collectSteps(dijkstraSteps(graph.nodes, graph.edges, graph.adjacency, 'S')),
    [graph],
  )
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <WeightedGraphView step={player.currentStep} />
        </div>
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
      />
    </div>
  )
}
