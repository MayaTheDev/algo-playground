import type { WeightedGraphStep, WeightedNode, WeightedEdge } from '../../types/algo.types'

export type WeightedGraph = Record<string, [string, number][]>

/** Generate a weighted graph */
export function generateWeightedGraph(): {
  nodes: WeightedNode[]
  edges: WeightedEdge[]
  adjacency: WeightedGraph
} {
  const nodes: WeightedNode[] = [
    { id: 'S', x: 10, y: 45 },
    { id: 'A', x: 30, y: 15 },
    { id: 'B', x: 30, y: 75 },
    { id: 'C', x: 55, y: 15 },
    { id: 'D', x: 55, y: 50 },
    { id: 'E', x: 55, y: 85 },
    { id: 'F', x: 80, y: 45 },
  ]

  const edgeDefs: [string, string, number][] = [
    ['S', 'A', 2], ['S', 'B', 5],
    ['A', 'C', 4], ['A', 'D', 1],
    ['B', 'D', 3], ['B', 'E', 6],
    ['C', 'F', 3], ['D', 'F', 7],
    ['E', 'F', 2],
  ]

  const edges: WeightedEdge[] = edgeDefs.map(([from, to, weight]) => ({ from, to, weight }))

  const adjacency: WeightedGraph = {}
  for (const n of nodes) adjacency[n.id] = []
  for (const [a, b, w] of edgeDefs) {
    adjacency[a].push([b, w])
    adjacency[b].push([a, w])
  }

  return { nodes, edges, adjacency }
}

/** Dijkstra's shortest path — yields each step */
export function* dijkstraSteps(
  nodes: WeightedNode[],
  edges: WeightedEdge[],
  adjacency: WeightedGraph,
  start: string,
): Generator<WeightedGraphStep> {
  const distances: Record<string, number> = {}
  const finalized = new Set<string>()
  const pq: [number, string][] = []

  for (const n of nodes) distances[n.id] = Infinity
  distances[start] = 0
  pq.push([0, start])

  yield {
    nodes, edges,
    distances: { ...distances },
    current: null,
    finalized: [],
    queue: pq.map(([, id]) => id),
    description: `Initialize distances. ${start}=0, all others=∞.`,
  }

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0])
    const [dist, node] = pq.shift()!

    if (finalized.has(node)) continue
    finalized.add(node)

    yield {
      nodes, edges,
      distances: { ...distances },
      current: node,
      finalized: [...finalized],
      queue: pq.map(([, id]) => id),
      description: `Finalize ${node} with distance ${dist}.`,
    }

    for (const [nb, w] of adjacency[node]) {
      if (finalized.has(nb)) continue
      const newDist = dist + w

      if (newDist < distances[nb]) {
        const oldDist = distances[nb]
        distances[nb] = newDist
        pq.push([newDist, nb])

        yield {
          nodes, edges,
          distances: { ...distances },
          current: node,
          finalized: [...finalized],
          queue: pq.map(([, id]) => id),
          description: `Relax ${node}→${nb}: ${oldDist === Infinity ? '∞' : oldDist} → ${newDist} (edge weight ${w}).`,
        }
      }
    }
  }

  yield {
    nodes, edges,
    distances: { ...distances },
    current: null,
    finalized: [...finalized],
    queue: [],
    description: `Dijkstra complete. Shortest distances from ${start}: ${nodes.map(n => `${n.id}=${distances[n.id]}`).join(', ')}.`,
  }
}
