import type { GraphStep } from '../types/algo.types'

type Props = { step: GraphStep }

export function GraphView({ step }: Props) {
  const { nodes, edges, current, visited, stack } = step

  return (
    <svg viewBox="0 0 100 95" className="w-full max-w-md mx-auto">
      {/* Edges */}
      {edges.map(({ from, to }) => {
        const a = nodes.find(n => n.id === from)!
        const b = nodes.find(n => n.id === to)!
        const bothVisited = visited.includes(from) && visited.includes(to)

        return (
          <line
            key={`${from}-${to}`}
            x1={a.x} y1={a.y}
            x2={b.x} y2={b.y}
            stroke={bothVisited ? '#34d399' : '#334155'}
            strokeWidth={bothVisited ? 0.8 : 0.5}
            strokeOpacity={bothVisited ? 0.8 : 0.4}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const isCurrent = node.id === current
        const isVisited = visited.includes(node.id)
        const inStack = stack.includes(node.id)

        let fill = '#1e293b'    // default: slate-800
        let stroke = '#475569'  // default: slate-600
        let r = 4.5

        if (isCurrent) {
          fill = '#34d399'      // emerald-400
          stroke = '#6ee7b7'    // emerald-300
          r = 5.5
        } else if (isVisited) {
          fill = '#065f46'      // emerald-900
          stroke = '#34d399'    // emerald-400
        } else if (inStack) {
          fill = '#1e3a5f'      // blue tint
          stroke = '#38bdf8'    // sky-400
        }

        return (
          <g key={node.id}>
            {isCurrent && (
              <circle
                cx={node.x} cy={node.y} r={r + 2}
                fill="none"
                stroke="#34d399"
                strokeWidth={0.3}
                opacity={0.5}
              />
            )}
            <circle
              cx={node.x} cy={node.y} r={r}
              fill={fill}
              stroke={stroke}
              strokeWidth={0.6}
            />
            <text
              x={node.x} y={node.y + 1.5}
              textAnchor="middle"
              fontSize="4"
              fontFamily="monospace"
              fill={isCurrent ? '#020617' : '#e2e8f0'}
              fontWeight={isCurrent ? 'bold' : 'normal'}
            >
              {node.id}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
