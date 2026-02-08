import type { GraphStep, GraphNode, GraphEdge } from '../../types/algo.types'

export type Graph = Record<string, string[]>

export function generateGraph(): { nodes: GraphNode[]; edges: GraphEdge[]; adjacency: Graph } {
  const nodeIds = ['A', 'B', 'C', 'D', 'E', 'F']

  const nodes: GraphNode[] = [
    { id: 'A', x: 50, y: 10 },
    { id: 'B', x: 20, y: 40 },
    { id: 'C', x: 80, y: 40 },
    { id: 'D', x: 10, y: 75 },
    { id: 'E', x: 45, y: 75 },
    { id: 'F', x: 75, y: 75 },
  ]

  const edgePairs: [string, string][] = [
    ['A', 'B'], ['A', 'C'],
    ['B', 'D'], ['B', 'E'],
    ['C', 'E'], ['C', 'F'],
  ]

  const edges: GraphEdge[] = edgePairs.map(([from, to]) => ({ from, to }))

  const adjacency: Graph = {}
  for (const id of nodeIds) adjacency[id] = []
  for (const [a, b] of edgePairs) {
    adjacency[a].push(b)
    adjacency[b].push(a)
  }

  return { nodes, edges, adjacency }
}

export function* dfsSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  adjacency: Graph,
  start: string,
): Generator<GraphStep> {
  const visited = new Set<string>()
  const stack: string[] = [start]

  yield {
    nodes,
    edges,
    current: null,
    visited: [],
    stack: [start],
    description: `Starting DFS from node ${start}. Push ${start} onto the stack.`,
  }

  while (stack.length > 0) {
    const node = stack.pop()!

    if (visited.has(node)) {
      yield {
        nodes,
        edges,
        current: node,
        visited: [...visited],
        stack: [...stack],
        description: `Node ${node} already visited — skip.`,
      }
      continue
    }

    visited.add(node)

    yield {
      nodes,
      edges,
      current: node,
      visited: [...visited],
      stack: [...stack],
      description: `Visit node ${node}. Mark as visited.`,
    }

    const neighbors = adjacency[node].filter(n => !visited.has(n))

    for (const n of neighbors.reverse()) {
      stack.push(n)
    }

    if (neighbors.length > 0) {
      yield {
        nodes,
        edges,
        current: node,
        visited: [...visited],
        stack: [...stack],
        description: `Push neighbors [${neighbors.join(', ')}] onto the stack.`,
      }
    } else {
      yield {
        nodes,
        edges,
        current: node,
        visited: [...visited],
        stack: [...stack],
        description: `Node ${node} has no unvisited neighbors. Backtrack.`,
      }
    }
  }

  yield {
    nodes,
    edges,
    current: null,
    visited: [...visited],
    stack: [],
    description: `DFS complete. Visited all ${visited.size} nodes.`,
  }
}
