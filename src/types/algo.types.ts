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

export type AlgoId =
  | 'binary-search'
  | 'bubble-sort'
  | 'merge-sort'
  | 'insertion-sort'
  | 'selection-sort'

export type AlgoMeta = {
  id: AlgoId
  label: string
  tag: string
  complexity: string
  description: string
}
