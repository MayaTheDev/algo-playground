import type { TopoNode, TopoEdge, TopoStep } from '../../types/algo.types'

const NODES: TopoNode[] = [
  { id: 'A', x: 15, y: 30 },
  { id: 'B', x: 15, y: 70 },
  { id: 'C', x: 40, y: 15 },
  { id: 'D', x: 40, y: 50 },
  { id: 'E', x: 40, y: 85 },
  { id: 'F', x: 70, y: 30 },
  { id: 'G', x: 70, y: 70 },
]

const EDGES: TopoEdge[] = [
  { from: 'A', to: 'C' },
  { from: 'A', to: 'D' },
  { from: 'B', to: 'D' },
  { from: 'B', to: 'E' },
  { from: 'C', to: 'F' },
  { from: 'D', to: 'F' },
  { from: 'D', to: 'G' },
  { from: 'E', to: 'G' },
]

function initialInDegrees(): Record<string, number> {
  const deg: Record<string, number> = {}
  for (const n of NODES) deg[n.id] = 0
  for (const e of EDGES) deg[e.to]++
  return deg
}

export function* topologicalSortSteps(): Generator<TopoStep> {
  const inDegrees = initialInDegrees()
  const queue: string[] = NODES.filter(n => inDegrees[n.id] === 0).map(n => n.id)
  const result: string[] = []

  yield {
    nodes: NODES,
    edges: EDGES,
    inDegrees: { ...inDegrees },
    queue: [...queue],
    result: [],
    current: null,
    reducedEdge: null,
    description: `Init. In-degrees: ${Object.entries(inDegrees).map(([k, v]) => `${k}=${v}`).join(', ')}. Queue: [${queue.join(', ')}].`,
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    result.push(current)

    yield {
      nodes: NODES,
      edges: EDGES,
      inDegrees: { ...inDegrees },
      queue: [...queue],
      result: [...result],
      current,
      reducedEdge: null,
      description: `Dequeue ${current}. Result so far: [${result.join(' → ')}].`,
    }

    for (const edge of EDGES) {
      if (edge.from !== current) continue
      inDegrees[edge.to]--

      yield {
        nodes: NODES,
        edges: EDGES,
        inDegrees: { ...inDegrees },
        queue: [...queue],
        result: [...result],
        current,
        reducedEdge: [current, edge.to],
        description: `Reduce edge ${current}→${edge.to}. In-degree[${edge.to}]=${inDegrees[edge.to]}.`,
      }

      if (inDegrees[edge.to] === 0) {
        queue.push(edge.to)
        yield {
          nodes: NODES,
          edges: EDGES,
          inDegrees: { ...inDegrees },
          queue: [...queue],
          result: [...result],
          current,
          reducedEdge: null,
          description: `${edge.to} has in-degree 0 — add to queue. Queue: [${queue.join(', ')}].`,
        }
      }
    }
  }

  yield {
    nodes: NODES,
    edges: EDGES,
    inDegrees: { ...inDegrees },
    queue: [],
    result: [...result],
    current: null,
    reducedEdge: null,
    description: `Done. Topological order: ${result.join(' → ')}.`,
  }
}
