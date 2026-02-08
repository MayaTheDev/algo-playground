import type { GraphStep, GraphNode, GraphEdge } from '../../types/algo.types'

export type Graph = Record<string, string[]>

/** Generate a larger graph for comparing DFS vs BFS */
export function generateSearchGraph(): { nodes: GraphNode[]; edges: GraphEdge[]; adjacency: Graph } {
  const nodes: GraphNode[] = [
    { id: 'S', x: 10, y: 45 },
    { id: 'A', x: 30, y: 20 },
    { id: 'B', x: 30, y: 70 },
    { id: 'C', x: 55, y: 10 },
    { id: 'D', x: 55, y: 45 },
    { id: 'E', x: 55, y: 80 },
    { id: 'F', x: 80, y: 30 },
    { id: 'G', x: 80, y: 65 },
  ]

  const edgePairs: [string, string][] = [
    ['S', 'A'], ['S', 'B'],
    ['A', 'C'], ['A', 'D'],
    ['B', 'D'], ['B', 'E'],
    ['C', 'F'], ['D', 'F'],
    ['D', 'G'], ['E', 'G'],
  ]

  const edges = edgePairs.map(([from, to]) => ({ from, to }))

  const adjacency: Graph = {}
  for (const n of nodes) adjacency[n.id] = []
  for (const [a, b] of edgePairs) {
    adjacency[a].push(b)
    adjacency[b].push(a)
  }

  return { nodes, edges, adjacency }
}

/** DFS traversal — uses a stack */
export function* dfsSearchSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  adjacency: Graph,
  start: string,
): Generator<GraphStep> {
  const visited = new Set<string>()
  const stack: string[] = [start]

  yield {
    nodes, edges,
    current: null,
    visited: [],
    stack: [start],
    description: `DFS: Push ${start} onto the stack.`,
  }

  while (stack.length > 0) {
    const node = stack.pop()!

    if (visited.has(node)) continue
    visited.add(node)

    yield {
      nodes, edges,
      current: node,
      visited: [...visited],
      stack: [...stack],
      description: `DFS: Visit ${node}. Stack: [${stack.join(', ')}]`,
    }

    const neighbors = adjacency[node].filter(n => !visited.has(n))
    for (const n of neighbors.reverse()) stack.push(n)

    if (neighbors.length > 0) {
      yield {
        nodes, edges,
        current: node,
        visited: [...visited],
        stack: [...stack],
        description: `DFS: Push [${neighbors.join(', ')}] onto stack.`,
      }
    }
  }

  yield {
    nodes, edges,
    current: null,
    visited: [...visited],
    stack: [],
    description: `DFS complete. Visited ${visited.size} nodes.`,
  }
}

/** BFS traversal — uses a queue */
export function* bfsSearchSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  adjacency: Graph,
  start: string,
): Generator<GraphStep> {
  const visited = new Set<string>()
  const queue: string[] = [start]
  visited.add(start)

  yield {
    nodes, edges,
    current: null,
    visited: [start],
    stack: [...queue],
    description: `BFS: Enqueue ${start}.`,
  }

  while (queue.length > 0) {
    const node = queue.shift()!

    yield {
      nodes, edges,
      current: node,
      visited: [...visited],
      stack: [...queue],
      description: `BFS: Dequeue ${node}. Queue: [${queue.join(', ')}]`,
    }

    const neighbors = adjacency[node].filter(n => !visited.has(n))
    for (const n of neighbors) {
      visited.add(n)
      queue.push(n)
    }

    if (neighbors.length > 0) {
      yield {
        nodes, edges,
        current: node,
        visited: [...visited],
        stack: [...queue],
        description: `BFS: Enqueue [${neighbors.join(', ')}].`,
      }
    }
  }

  yield {
    nodes, edges,
    current: null,
    visited: [...visited],
    stack: [],
    description: `BFS complete. Visited ${visited.size} nodes layer by layer.`,
  }
}
