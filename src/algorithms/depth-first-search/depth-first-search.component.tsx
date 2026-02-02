import { useMemo } from 'react'
import { GraphView } from '../../components/graph-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { dfsSteps, generateGraph } from './dfs.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'current' },
  { color: 'bg-emerald-900', label: 'visited' },
  { color: 'bg-sky-400', label: 'in stack' },
  { color: 'bg-slate-700', label: 'unvisited' },
]

export function DepthFirstSearch() {
  const graph = useMemo(() => generateGraph(), [])

  const steps = useMemo(
    () => collectSteps(dfsSteps(graph.nodes, graph.edges, graph.adjacency, 'A')),
    [graph],
  )
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-3 text-center">
            <span className="text-xs text-slate-500 font-mono">stack: </span>
            <span className="text-sm font-mono text-emerald-400">
              [{player.currentStep.stack.join(', ')}]
            </span>
          </div>
          <GraphView step={player.currentStep} />
        </div>
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
        onNewInput={() => {}}
      />
    </div>
  )
}
