import type { TopoStep } from '../types/algo.types'

type Props = { step: TopoStep }

export function TopoView({ step }: Props) {
  const { nodes, edges, inDegrees, queue, result, current, reducedEdge } = step

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-md mx-auto">
      <defs>
        <marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#475569" />
        </marker>
        <marker id="arrow-active" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#34d399" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map(edge => {
        const a = nodes.find(n => n.id === edge.from)!
        const b = nodes.find(n => n.id === edge.to)!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const r = 5
        const x1 = a.x + (dx / len) * r
        const y1 = a.y + (dy / len) * r
        const x2 = b.x - (dx / len) * (r + 1)
        const y2 = b.y - (dy / len) * (r + 1)
        const isReduced = reducedEdge && reducedEdge[0] === edge.from && reducedEdge[1] === edge.to

        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isReduced ? '#34d399' : '#334155'}
            strokeWidth={isReduced ? 0.8 : 0.5}
            markerEnd={isReduced ? 'url(#arrow-active)' : 'url(#arrow)'}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const isDone = result.includes(node.id)
        const isCurrent = node.id === current
        const inQueue = queue.includes(node.id)

        let fill = '#1e293b'
        let stroke = '#475569'
        let textFill = '#e2e8f0'

        if (isCurrent) {
          fill = '#34d399'
          stroke = '#34d399'
          textFill = '#020617'
        } else if (isDone) {
          fill = '#064e3b'
          stroke = '#34d399'
        } else if (inQueue) {
          fill = '#0c2a3f'
          stroke = '#38bdf8'
        }

        return (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={5} fill={fill} stroke={stroke} strokeWidth={0.6} />
            <text
              x={node.x} y={node.y + 1.3}
              textAnchor="middle" fontSize="3.5" fontFamily="monospace"
              fill={textFill} fontWeight={isCurrent ? 'bold' : 'normal'}
            >
              {node.id}
            </text>
            {/* In-degree badge */}
            <circle cx={node.x + 4} cy={node.y - 4} r={2} fill="#020617" stroke="#475569" strokeWidth={0.4} />
            <text
              x={node.x + 4} y={node.y - 3.1}
              textAnchor="middle" fontSize="2" fontFamily="monospace" fill="#94a3b8"
            >
              {inDegrees[node.id]}
            </text>
          </g>
        )
      })}

      {/* Result sequence */}
      {result.length > 0 && (
        <g>
          <text x={5} y={96} fontSize="2.5" fontFamily="monospace" fill="#475569">order:</text>
          {result.map((id, i) => (
            <text key={id} x={18 + i * 9} y={96} fontSize="2.5" fontFamily="monospace" fill="#34d399">
              {i > 0 ? `→${id}` : id}
            </text>
          ))}
        </g>
      )}
    </svg>
  )
}
