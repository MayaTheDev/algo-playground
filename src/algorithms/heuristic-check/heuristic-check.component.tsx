import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'

type FrontierNode = {
  id: string
  g: number
  h: number
  onBestPath: boolean
}

type HeuristicStep = {
  mode: 'admissible' | 'overestimate'
  nodes: FrontierNode[]
  chosen: string | null
  description: string
}

function withScores(nodes: FrontierNode[]) {
  return nodes.map((node) => ({ ...node, f: node.g + node.h }))
}

function* heuristicSteps(): Generator<HeuristicStep> {
  const frontier = [
    { id: 'A', g: 4, h: 2, onBestPath: false },
    { id: 'B', g: 5, h: 1, onBestPath: true },
    { id: 'C', g: 3, h: 4, onBestPath: false },
  ]

  yield {
    mode: 'admissible',
    nodes: frontier,
    chosen: null,
    description: 'A* ranks frontier nodes by f(n) = g(n) + h(n). The heuristic only works if h never overstates the remaining cost.',
  }
  yield {
    mode: 'admissible',
    nodes: frontier,
    chosen: 'B',
    description: 'Honest heuristic: node B wins with the lowest f-score and stays on the actual best path.',
  }

  const inflated = [
    { id: 'A', g: 4, h: 2, onBestPath: false },
    { id: 'B', g: 5, h: 5, onBestPath: true },
    { id: 'C', g: 3, h: 4, onBestPath: false },
  ]

  yield {
    mode: 'overestimate',
    nodes: inflated,
    chosen: null,
    description: 'Now overestimate B. The heuristic sounds confident, but it is lying about the remaining distance.',
  }
  yield {
    mode: 'overestimate',
    nodes: inflated,
    chosen: 'A',
    description: 'A* now expands A first. That is the whole risk: confident scoring on the wrong frontier node.',
  }
  yield {
    mode: 'overestimate',
    nodes: inflated,
    chosen: 'A',
    description: 'Admissibility is not pedantry. It is what keeps the search fast without quietly discarding the optimal route.',
  }
}

const LEGEND = [
  { color: 'bg-emerald-400', label: 'best-path node' },
  { color: 'bg-amber-400', label: 'chosen node' },
]

function HeuristicCheckView({ step }: { step: HeuristicStep }) {
  const scored = withScores(step.nodes)

  return (
    <div className="w-full max-w-3xl space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {scored.map((node) => {
          const chosen = node.id === step.chosen
          return (
            <div
              key={node.id}
              className={`border p-4 font-mono ${
                chosen
                  ? 'border-amber-500 bg-amber-500/10'
                  : node.onBestPath
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/40'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-200">node {node.id}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500">
                  {node.onBestPath ? 'optimal path' : 'candidate'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <div>g = {node.g}</div>
                <div>h = {node.h}</div>
                <div className="text-emerald-300">f = {node.f}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/40 p-4 font-mono text-sm text-slate-300">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">heuristic mode</div>
        <div className={step.mode === 'admissible' ? 'text-emerald-300' : 'text-amber-300'}>
          {step.mode === 'admissible' ? 'admissible / honest' : 'overestimating / untrustworthy'}
        </div>
      </div>
    </div>
  )
}

export function HeuristicCheck() {
  const steps = useMemo(() => collectSteps(heuristicSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        <HeuristicCheckView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
