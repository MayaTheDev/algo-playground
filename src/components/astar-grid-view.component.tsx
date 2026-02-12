import type { AStarStep } from '../types/algo.types'

type Props = { step: AStarStep }

const STATE_FILL: Record<string, string> = {
  empty: '#0f172a',
  wall: '#334155',
  start: '#38bdf8',
  end: '#f59e0b',
  open: '#1d4a2f',
  closed: '#312e81',
  path: '#34d399',
}

const STATE_STROKE: Record<string, string> = {
  open: '#34d399',
  closed: '#6366f1',
}

export function AStarGridView({ step }: Props) {
  const { grid } = step
  const rows = grid.length
  const cols = grid[0].length
  const cellSize = 9
  const pad = 2
  const w = cols * cellSize + pad * 2
  const h = rows * cellSize + pad * 2

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md mx-auto">
      <rect x={0} y={0} width={w} height={h} fill="#020617" />
      {grid.flatMap(row =>
        row.map(cell => {
          const x = pad + cell.col * cellSize
          const y = pad + cell.row * cellSize
          const fill = STATE_FILL[cell.state] ?? '#0f172a'
          const stroke = STATE_STROKE[cell.state] ?? '#1e293b'
          return (
            <rect
              key={`${cell.row}-${cell.col}`}
              x={x + 0.5}
              y={y + 0.5}
              width={cellSize - 1}
              height={cellSize - 1}
              fill={fill}
              stroke={stroke}
              strokeWidth={STATE_STROKE[cell.state] ? 0.6 : 0.2}
              rx={0.5}
            />
          )
        }),
      )}
    </svg>
  )
}
