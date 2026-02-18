import React from 'react'
import type { BSTStep, BSTNodeData } from '../types/algo.types'

type Props = { step: BSTStep }

type PositionedNode = { node: BSTNodeData; x: number; y: number }

function collectNodes(
  node: BSTNodeData | null,
  depth: number,
  left: number,
  right: number,
  result: PositionedNode[],
) {
  if (!node) return
  const x = (left + right) / 2
  const y = 10 + depth * 22
  result.push({ node, x, y })
  collectNodes(node.left, depth + 1, left, (left + right) / 2, result)
  collectNodes(node.right, depth + 1, (left + right) / 2, right, result)
}

function findPosition(nodes: PositionedNode[], value: number): PositionedNode | undefined {
  return nodes.find(n => n.node.value === value)
}

export function BSTView({ step }: Props) {
  const { root, highlighted, pathValues } = step
  const positioned: PositionedNode[] = []
  collectNodes(root, 0, 5, 95, positioned)

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-md mx-auto">
      <rect x={0} y={0} width={100} height={100} fill="#020617" />

      {/* Edges */}
      {positioned.map(({ node, x, y }) => {
        const results: React.ReactElement[] = []
        if (node.left) {
          const child = findPosition(positioned, node.left.value)
          if (child) {
            results.push(
              <line key={`${node.value}-L`} x1={x} y1={y} x2={child.x} y2={child.y} stroke="#1e293b" strokeWidth={0.5} />,
            )
          }
        }
        if (node.right) {
          const child = findPosition(positioned, node.right.value)
          if (child) {
            results.push(
              <line key={`${node.value}-R`} x1={x} y1={y} x2={child.x} y2={child.y} stroke="#1e293b" strokeWidth={0.5} />,
            )
          }
        }
        return results
      })}

      {/* Nodes */}
      {positioned.map(({ node, x, y }) => {
        const isHighlighted = node.value === highlighted
        const inPath = pathValues.includes(node.value)

        let fill = '#1e293b'
        let stroke = '#475569'
        let textFill = '#e2e8f0'

        if (isHighlighted) {
          fill = '#34d399'
          stroke = '#34d399'
          textFill = '#020617'
        } else if (inPath) {
          fill = '#0c2a3f'
          stroke = '#38bdf8'
          textFill = '#38bdf8'
        }

        return (
          <g key={node.value}>
            <circle cx={x} cy={y} r={5} fill={fill} stroke={stroke} strokeWidth={0.6} />
            <text
              x={x} y={y + 1.5}
              textAnchor="middle" fontSize="3.5" fontFamily="monospace"
              fill={textFill} fontWeight={isHighlighted ? 'bold' : 'normal'}
            >
              {node.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
