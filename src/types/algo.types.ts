export type SortStep = {
  array: number[]
  comparing: [number, number] | null
  sorted: number[]
  activeRange: [number, number] | null
  description: string
}

export type SearchStep = {
  array: number[]
  target: number
  left: number
  right: number
  mid: number
  found: number | null
  eliminated: number[]
  description: string
}

export type GraphNode = {
  id: string
  x: number
  y: number
}

export type GraphEdge = {
  from: string
  to: string
}

export type GraphStep = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  current: string | null
  visited: string[]
  stack: string[]
  description: string
}

export type MazeCell = {
  row: number
  col: number
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean }
}

export type MazeStep = {
  grid: MazeCell[][]
  current: [number, number] | null
  visited: [number, number][]
  path: [number, number][]
  start: [number, number]
  end: [number, number]
  description: string
}

export type DpStep = {
  table: number[]
  current: number
  comparing: [number, number] | null
  filled: number[]
  coins: number[]
  amount: number
  description: string
}

export type WeightedNode = {
  id: string
  x: number
  y: number
}

export type WeightedEdge = {
  from: string
  to: string
  weight: number
}

export type WeightedGraphStep = {
  nodes: WeightedNode[]
  edges: WeightedEdge[]
  distances: Record<string, number>
  current: string | null
  finalized: string[]
  queue: string[]
  description: string
}

export type SortAlgoId = 'bubble-sort' | 'merge-sort' | 'insertion-sort' | 'selection-sort'

export type AlgoId =
  | 'binary-search'
  | 'depth-first-search'
  | 'maze'
  | 'bfs-vs-dfs'
  | 'coin-change'
  | 'dijkstra'
  | SortAlgoId

export type AlgoMeta = {
  id: AlgoId
  label: string
  tag: string
  complexity: string
  description: string
}
