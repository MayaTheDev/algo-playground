import { useState } from 'react'
import { AlgoSelector } from './components/algo-selector.component'
import { CompareView } from './components/compare-view.component'
import { BinarySearch } from './algorithms/binary-search/binary-search.component'
import { BubbleSort } from './algorithms/bubble-sort/bubble-sort.component'
import { MergeSort } from './algorithms/merge-sort/merge-sort.component'
import { InsertionSort } from './algorithms/insertion-sort/insertion-sort.component'
import { SelectionSort } from './algorithms/selection-sort/selection-sort.component'
import { DepthFirstSearch } from './algorithms/depth-first-search/depth-first-search.component'
import { Maze } from './algorithms/maze/maze.component'
import { BfsVsDfs } from './algorithms/bfs-vs-dfs/bfs-vs-dfs.component'
import { CoinChange } from './algorithms/coin-change/coin-change.component'
import { Dijkstra } from './algorithms/dijkstra/dijkstra.component'
import { AStar } from './algorithms/a-star/a-star.component'
import { TopologicalSort } from './algorithms/topological-sort/topological-sort.component'
import { Trie } from './algorithms/trie/trie.component'
import { SlidingWindow } from './algorithms/sliding-window/sliding-window.component'
import { TwoPointers } from './algorithms/two-pointers/two-pointers.component'
import { MonotonicStack } from './algorithms/monotonic-stack/monotonic-stack.component'
import { BinarySearchTree } from './algorithms/binary-search-tree/binary-search-tree.component'
import type { AlgoId, AlgoMeta } from './types/algo.types'

type View = AlgoId | 'compare'

const ALGOS: AlgoMeta[] = [
  // Day 8 — searching
  {
    id: 'binary-search',
    label: 'Binary Search',
    tag: '#BinarySearch',
    complexity: 'O(log n)',
    description: 'Divide a sorted array in half each step to find a target.',
  },
  // Days 21–22 — sorting
  {
    id: 'bubble-sort',
    label: 'Bubble Sort',
    tag: '#BubbleSort',
    complexity: 'O(n²)',
    description: 'Repeatedly swap adjacent elements that are out of order.',
  },
  {
    id: 'merge-sort',
    label: 'Merge Sort',
    tag: '#MergeSort',
    complexity: 'O(n log n)',
    description: 'Split, sort recursively, then merge back together.',
  },
  {
    id: 'insertion-sort',
    label: 'Insertion Sort',
    tag: '#InsertionSort',
    complexity: 'O(n²)',
    description: 'Insert each element into its correct position one at a time.',
  },
  {
    id: 'selection-sort',
    label: 'Selection Sort',
    tag: '#SelectionSort',
    complexity: 'O(n²)',
    description: 'Find the minimum element, place it at the front. Repeat.',
  },
  // Day 23 — graph traversal
  {
    id: 'depth-first-search',
    label: 'Depth-First Search',
    tag: '#DFS',
    complexity: 'O(V + E)',
    description: 'Start at a node. Go as deep as you can. Dead end. Backtrack.',
  },
  {
    id: 'maze',
    label: 'Maze Solver',
    tag: '#Maze',
    complexity: 'O(V + E)',
    description: 'Navigate a generated maze with DFS backtracking.',
  },
  // Day 24 — BFS
  {
    id: 'bfs-vs-dfs',
    label: 'BFS vs DFS',
    tag: '#BFSvsDFS',
    complexity: 'O(V + E)',
    description: 'Same graph, two traversal strategies. Stack vs queue.',
  },
  // Day 25 — dynamic programming
  {
    id: 'coin-change',
    label: 'Coin Change',
    tag: '#DP',
    complexity: 'O(n × amount)',
    description: 'Find minimum coins to make change. Classic dynamic programming.',
  },
  // Day 26 — weighted graphs
  {
    id: 'dijkstra',
    label: 'Dijkstra\'s',
    tag: '#Dijkstra',
    complexity: 'O((V+E) log V)',
    description: 'Find shortest weighted path. Always process the cheapest node first.',
  },
  {
    id: 'a-star',
    label: 'A* Search',
    tag: '#AStar',
    complexity: 'O((V+E) log V)',
    description: 'Pathfinding with a heuristic. f = g + h. Faster than Dijkstra\'s when direction matters.',
    availableFrom: '2026-05-05',
  },
  {
    id: 'topological-sort',
    label: 'Topological Sort',
    tag: '#TopoSort',
    complexity: 'O(V+E)',
    description: 'Order tasks by dependency. Kahn\'s algorithm with in-degree queue.',
    availableFrom: '2026-05-07',
  },
  {
    id: 'trie',
    label: 'Trie',
    tag: '#Trie',
    complexity: 'O(m)',
    description: 'Prefix tree for fast string lookup. O(prefix length) search time.',
    availableFrom: '2026-05-14',
  },
  {
    id: 'sliding-window',
    label: 'Sliding Window',
    tag: '#SlidingWindow',
    complexity: 'O(n)',
    description: 'Track a moving subarray. Add new element, remove old one. No recomputation.',
    availableFrom: '2026-05-19',
  },
  {
    id: 'two-pointers',
    label: 'Two Pointers',
    tag: '#TwoPointers',
    complexity: 'O(n)',
    description: 'Navigate a sorted array from both ends. Move the pointer that gets you closer.',
    availableFrom: '2026-05-21',
  },
  {
    id: 'monotonic-stack',
    label: 'Monotonic Stack',
    tag: '#MonoStack',
    complexity: 'O(n)',
    description: 'A stack that stays sorted. Pop everything a larger element invalidates.',
    availableFrom: '2026-05-26',
  },
  {
    id: 'binary-search-tree',
    label: 'BST',
    tag: '#BST',
    complexity: 'O(log n)',
    description: 'Binary search tree. Left < node < right. Insert, search, delete with in-order successor.',
    availableFrom: '2026-05-28',
  },
]

const ALGO_COMPONENTS: Record<AlgoId, React.ComponentType> = {
  'depth-first-search': DepthFirstSearch,
  'binary-search': BinarySearch,
  'bubble-sort': BubbleSort,
  'merge-sort': MergeSort,
  'insertion-sort': InsertionSort,
  'selection-sort': SelectionSort,
  'maze': Maze,
  'bfs-vs-dfs': BfsVsDfs,
  'coin-change': CoinChange,
  'dijkstra': Dijkstra,
  'a-star': AStar,
  'topological-sort': TopologicalSort,
  'trie': Trie,
  'sliding-window': SlidingWindow,
  'two-pointers': TwoPointers,
  'monotonic-stack': MonotonicStack,
  'binary-search-tree': BinarySearchTree,
}

const PREVIEW_ALL = import.meta.env.VITE_PREVIEW === 'true'
const now = new Date()
const visibleAlgos = PREVIEW_ALL
  ? ALGOS
  : ALGOS.filter(a => !a.availableFrom || new Date(a.availableFrom) <= now)

const VIEW_OPTIONS = [
  ...visibleAlgos.map(a => ({ value: a.id as View, label: a.label })),
  { value: 'compare' as View, label: 'Compare' },
]

export function App() {
  const [view, setView] = useState<View>('depth-first-search')

  const meta = visibleAlgos.find(a => a.id === view)
  const ActiveComponent = view !== 'compare' ? ALGO_COMPONENTS[view as AlgoId] : null

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden">
      <AlgoSelector selected={view} onSelect={setView} algos={visibleAlgos} />

      <div className="flex-1 flex flex-col min-w-0 relative scanline-effect overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-sm neon-text">algo-playground</span>
            <span className="text-slate-600 text-sm hidden sm:block">//</span>
            <span className="text-slate-500 text-xs font-mono hidden sm:block">maya</span>
          </div>

          {/* Mobile algo picker */}
          <select
            value={view}
            onChange={e => setView(e.target.value as View)}
            className="md:hidden bg-[#020617] text-xs font-mono text-slate-300 border border-slate-700 px-2 py-1 focus:outline-none focus:border-emerald-600 flex-1 max-w-[160px]"
          >
            {VIEW_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <a
            href="https://mayathedev.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors font-mono shrink-0"
          >
            mayathedev.com ↗
          </a>
        </header>

        {/* Algorithm title — hidden in compare mode */}
        {meta && (
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-baseline gap-3">
              <h1 className="text-sm font-mono text-slate-200">{meta.label}</h1>
              <span className="text-xs text-emerald-500 font-mono">{meta.complexity}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{meta.description}</p>
          </div>
        )}

        {view === 'compare' && (
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-baseline gap-3">
              <h1 className="text-sm font-mono text-slate-200">Compare</h1>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Run two sorting algorithms on the same data. Watch one finish while the other crawls.</p>
          </div>
        )}

        {/* Visualizer */}
        <div className="flex-1 min-h-0">
          {view === 'compare'
            ? <CompareView key="compare" />
            : ActiveComponent && <ActiveComponent key={view} />
          }
        </div>
      </div>
    </div>
  )
}
