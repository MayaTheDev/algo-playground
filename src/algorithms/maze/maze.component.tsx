import { useState, useMemo } from 'react'
import { MazeView } from '../../components/maze-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { generateMaze, mazeSolveSteps } from './maze.logic'

const LEGEND = [
  { color: 'bg-sky-400', label: 'start' },
  { color: 'bg-amber-500', label: 'end' },
  { color: 'bg-emerald-400', label: 'current' },
  { color: 'bg-emerald-900', label: 'path' },
]

export function Maze() {
  const [grid, setGrid] = useState(() => generateMaze())

  const rows = grid.length
  const cols = grid[0].length
  const start: [number, number] = [0, 0]
  const end: [number, number] = [rows - 1, cols - 1]

  const steps = useMemo(
    () => collectSteps(mazeSolveSteps(grid, start, end)),
    [grid],
  )
  const player = useAlgoPlayer(steps)

  const handleNewInput = () => {
    player.reset()
    setGrid(generateMaze())
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <MazeView step={player.currentStep} />
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
