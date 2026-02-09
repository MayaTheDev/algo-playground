import { useState, useMemo } from 'react'
import { GraphView } from '../../components/graph-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { generateSearchGraph, dfsSearchSteps, bfsSearchSteps } from './search.logic'

const LEGEND_DFS = [
  { color: 'bg-emerald-400', label: 'current' },
  { color: 'bg-emerald-900', label: 'visited' },
  { color: 'bg-sky-400', label: 'stack' },
]

const LEGEND_BFS = [
  { color: 'bg-emerald-400', label: 'current' },
  { color: 'bg-emerald-900', label: 'visited' },
  { color: 'bg-sky-400', label: 'queue' },
]

export function BfsVsDfs() {
  const [mode, setMode] = useState<'dfs' | 'bfs'>('dfs')
  const graph = useMemo(() => generateSearchGraph(), [])

  const dfsSteps = useMemo(
    () => collectSteps(dfsSearchSteps(graph.nodes, graph.edges, graph.adjacency, 'S')),
    [graph],
  )
  const bfsStepsList = useMemo(
    () => collectSteps(bfsSearchSteps(graph.nodes, graph.edges, graph.adjacency, 'S')),
    [graph],
  )

  const steps = mode === 'dfs' ? dfsSteps : bfsStepsList
  const player = useAlgoPlayer(steps)

  const toggleMode = () => {
    player.reset()
    setMode(m => (m === 'dfs' ? 'bfs' : 'dfs'))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-3 flex items-center justify-center gap-3">
            <button
              onClick={toggleMode}
              className={`px-3 py-1 text-xs font-mono border transition-colors ${
                mode === 'dfs'
                  ? 'border-emerald-600 text-emerald-400'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              DFS (stack)
            </button>
            <button
              onClick={toggleMode}
              className={`px-3 py-1 text-xs font-mono border transition-colors ${
                mode === 'bfs'
                  ? 'border-emerald-600 text-emerald-400'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              BFS (queue)
            </button>
          </div>
          <div className="mb-3 text-center">
            <span className="text-xs text-slate-500 font-mono">
              {mode === 'dfs' ? 'stack' : 'queue'}:{' '}
            </span>
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
        legend={mode === 'dfs' ? LEGEND_DFS : LEGEND_BFS}
      />
    </div>
  )
}
