import type { WeightedGraphStep } from '../types/algo.types'

type Props = { step: WeightedGraphStep }

export function WeightedGraphView({ step }: Props) {
  const { nodes, edges, distances, current, finalized, queue } = step

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-md mx-auto">
      {/* Edges with weights */}
      {edges.map(({ from, to, weight }) => {
        const a = nodes.find(n => n.id === from)!
        const b = nodes.find(n => n.id === to)!
        const bothDone = finalized.includes(from) && finalized.includes(to)
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2

        return (
          <g key={`${from}-${to}`}>
            <line
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke={bothDone ? '#f59e0b' : '#334155'}
              strokeWidth={bothDone ? 0.8 : 0.4}
              strokeOpacity={bothDone ? 0.8 : 0.4}
            />
            <text
              x={mx} y={my - 1.5}
              textAnchor="middle"
              fontSize="3"
              fontFamily="monospace"
              fill={bothDone ? '#f59e0b' : '#64748b'}
            >
              {weight}
            </text>
          </g>
        )
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const isCurrent = node.id === current
        const isDone = finalized.includes(node.id)
        const inQueue = queue.includes(node.id)
        const dist = distances[node.id]

        let fill = '#1e293b'
        let stroke = '#475569'
        let r = 5

        if (isCurrent) {
          fill = '#f59e0b'
          stroke = '#fbbf24'
          r = 6
        } else if (isDone) {
          fill = '#78350f'
          stroke = '#f59e0b'
        } else if (inQueue) {
          fill = '#1e3a5f'
          stroke = '#38bdf8'
        }

        return (
          <g key={node.id}>
            {isCurrent && (
              <circle cx={node.x} cy={node.y} r={r + 2} fill="none" stroke="#f59e0b" strokeWidth={0.3} opacity={0.5} />
            )}
            <circle cx={node.x} cy={node.y} r={r} fill={fill} stroke={stroke} strokeWidth={0.6} />
            <text
              x={node.x} y={node.y + 1.2}
              textAnchor="middle" fontSize="3.5" fontFamily="monospace"
              fill={isCurrent ? '#020617' : '#e2e8f0'}
              fontWeight={isCurrent ? 'bold' : 'normal'}
            >
              {node.id}
            </text>
            <text
              x={node.x} y={node.y + 6}
              textAnchor="middle" fontSize="2.5" fontFamily="monospace"
              fill={isDone ? '#f59e0b' : '#64748b'}
            >
              {dist === Infinity ? '∞' : dist}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
