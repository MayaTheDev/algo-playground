import type { MazeStep } from '../types/algo.types'

type Props = { step: MazeStep }

export function MazeView({ step }: Props) {
  const { grid, current, visited, path, start, end } = step
  const rows = grid.length
  const cols = grid[0].length
  const cellSize = 10
  const pad = 2
  const w = cols * cellSize + pad * 2
  const h = rows * cellSize + pad * 2

  const isVisited = (r: number, c: number) => visited.some(([vr, vc]) => vr === r && vc === c)
  const isPath = (r: number, c: number) => path.some(([pr, pc]) => pr === r && pc === c)
  const isCurrent = (r: number, c: number) => current !== null && current[0] === r && current[1] === c
  const isStart = (r: number, c: number) => r === start[0] && c === start[1]
  const isEnd = (r: number, c: number) => r === end[0] && c === end[1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-lg mx-auto">
      <rect x={0} y={0} width={w} height={h} fill="#020617" />
      {grid.flatMap((row, r) =>
        row.map((cell, c) => {
          const x = pad + c * cellSize
          const y = pad + r * cellSize
          let fill = '#0f172a'
          if (isCurrent(r, c)) fill = '#34d399'
          else if (isEnd(r, c)) fill = '#f59e0b'
          else if (isStart(r, c)) fill = '#38bdf8'
          else if (isPath(r, c)) fill = '#065f46'
          else if (isVisited(r, c)) fill = '#1e293b'

          return (
            <g key={`${r}-${c}`}>
              <rect x={x + 0.5} y={y + 0.5} width={cellSize - 1} height={cellSize - 1} fill={fill} rx={0.5} />
              {cell.walls.top && (
                <line x1={x} y1={y} x2={x + cellSize} y2={y} stroke="#334155" strokeWidth={0.5} />
              )}
              {cell.walls.right && (
                <line x1={x + cellSize} y1={y} x2={x + cellSize} y2={y + cellSize} stroke="#334155" strokeWidth={0.5} />
              )}
              {cell.walls.bottom && (
                <line x1={x} y1={y + cellSize} x2={x + cellSize} y2={y + cellSize} stroke="#334155" strokeWidth={0.5} />
              )}
              {cell.walls.left && (
                <line x1={x} y1={y} x2={x} y2={y + cellSize} stroke="#334155" strokeWidth={0.5} />
              )}
              {isStart(r, c) && (
                <text x={x + cellSize / 2} y={y + cellSize / 2 + 1.5} textAnchor="middle" fontSize="3.5" fontFamily="monospace" fill="#020617" fontWeight="bold">S</text>
              )}
              {isEnd(r, c) && (
                <text x={x + cellSize / 2} y={y + cellSize / 2 + 1.5} textAnchor="middle" fontSize="3.5" fontFamily="monospace" fill="#020617" fontWeight="bold">E</text>
              )}
            </g>
          )
        }),
      )}
    </svg>
  )
}
