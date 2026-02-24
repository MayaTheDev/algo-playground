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
import { Heap } from './algorithms/heap/heap.component'
import { UrlShortener } from './algorithms/url-shortener/url-shortener.component'
import { AvlTree } from './algorithms/avl-tree/avl-tree.component'
import { HeuristicCheck } from './algorithms/heuristic-check/heuristic-check.component'
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
    day: 8,
  },
  // Days 21–22 — sorting
  {
    id: 'bubble-sort',
    label: 'Bubble Sort',
    tag: '#BubbleSort',
    complexity: 'O(n²)',
    description: 'Repeatedly swap adjacent elements that are out of order.',
    day: 21,
  },
  {
    id: 'merge-sort',
    label: 'Merge Sort',
    tag: '#MergeSort',
    complexity: 'O(n log n)',
    description: 'Split, sort recursively, then merge back together.',
    day: 21,
  },
  {
    id: 'insertion-sort',
    label: 'Insertion Sort',
    tag: '#InsertionSort',
    complexity: 'O(n²)',
    description: 'Insert each element into its correct position one at a time.',
    day: 22,
  },
  {
    id: 'selection-sort',
    label: 'Selection Sort',
    tag: '#SelectionSort',
    complexity: 'O(n²)',
    description: 'Find the minimum element, place it at the front. Repeat.',
    day: 22,
  },
  // Day 23 — graph traversal
  {
    id: 'depth-first-search',
    label: 'Depth-First Search',
    tag: '#DFS',
    complexity: 'O(V + E)',
    description: 'Start at a node. Go as deep as you can. Dead end. Backtrack.',
    day: 23,
  },
  {
    id: 'maze',
    label: 'Maze Solver',
    tag: '#Maze',
    complexity: 'O(V + E)',
    description: 'Navigate a generated maze with DFS backtracking.',
    day: 23,
  },
  // Day 24 — BFS
  {
    id: 'bfs-vs-dfs',
    label: 'BFS vs DFS',
    tag: '#BFSvsDFS',
    complexity: 'O(V + E)',
    description: 'Same graph, two traversal strategies. Stack vs queue.',
    day: 24,
  },
  // Day 25 — dynamic programming
  {
    id: 'coin-change',
    label: 'Coin Change',
    tag: '#DP',
    complexity: 'O(n × amount)',
    description: 'Find minimum coins to make change. Classic dynamic programming.',
    day: 25,
  },
  // Day 26 — weighted graphs
  {
    id: 'dijkstra',
    label: 'Dijkstra\'s',
    tag: '#Dijkstra',
    complexity: 'O((V+E) log V)',
    description: 'Find shortest weighted path. Always process the cheapest node first.',
    day: 26,
  },
  {
    id: 'a-star',
    label: 'A* Search',
    tag: '#AStar',
    complexity: 'O((V+E) log V)',
    description: 'Pathfinding with a heuristic. f = g + h. Faster than Dijkstra\'s when direction matters.',
    day: 27,
    availableFrom: '2026-05-05',
  },
  {
    id: 'topological-sort',
    label: 'Topological Sort',
    tag: '#TopoSort',
    complexity: 'O(V+E)',
    description: 'Order tasks by dependency. Kahn\'s algorithm with in-degree queue.',
    day: 28,
    availableFrom: '2026-05-07',
  },
  {
    id: 'trie',
    label: 'Trie',
    tag: '#Trie',
    complexity: 'O(m)',
    description: 'Prefix tree for fast string lookup. O(prefix length) search time.',
    day: 30,
    availableFrom: '2026-05-14',
  },
  {
    id: 'sliding-window',
    label: 'Sliding Window',
    tag: '#SlidingWindow',
    complexity: 'O(n)',
    description: 'Track a moving subarray. Add new element, remove old one. No recomputation.',
    day: 31,
    availableFrom: '2026-05-19',
  },
  {
    id: 'two-pointers',
    label: 'Two Pointers',
    tag: '#TwoPointers',
    complexity: 'O(n)',
    description: 'Navigate a sorted array from both ends. Move the pointer that gets you closer.',
    day: 32,
    availableFrom: '2026-05-21',
  },
  {
    id: 'monotonic-stack',
    label: 'Monotonic Stack',
    tag: '#MonoStack',
    complexity: 'O(n)',
    description: 'A stack that stays sorted. Pop everything a larger element invalidates.',
    day: 33,
    availableFrom: '2026-05-26',
  },
  {
    id: 'binary-search-tree',
    label: 'BST',
    tag: '#BST',
    complexity: 'O(log n)',
    description: 'Binary search tree. Left < node < right. Insert, search, delete with in-order successor.',
    day: 34,
    availableFrom: '2026-05-28',
  },
  {
    id: 'heap',
    label: 'Heap',
    tag: '#Heap',
    complexity: 'O(log n)',
    description: 'Priority queue core. Bubble values up on insert, sift them down on extract.',
    day: 35,
    availableFrom: '2026-06-02',
  },
  {
    id: 'url-shortener',
    label: 'URL Shortener',
    tag: '#SystemDesign',
    complexity: 'O(1) avg',
    description: 'Create short codes, store mappings, and serve redirects with cache and analytics in the loop.',
    day: 36,
    availableFrom: '2026-06-04',
  },
  {
    id: 'avl-tree',
    label: 'AVL Tree',
    tag: '#AVL',
    complexity: 'O(log n)',
    description: 'A self-balancing BST. Rotations keep lookup cost from collapsing to linear time.',
    day: 37,
    availableFrom: '2026-06-09',
  },
  {
    id: 'heuristic-check',
    label: 'Heuristic Check',
    tag: '#AStar',
    complexity: 'f(n) = g + h',
    description: 'A* only stays trustworthy when the heuristic stays honest about the distance remaining.',
    day: 39,
    availableFrom: '2026-06-16',
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
  'heap': Heap,
  'url-shortener': UrlShortener,
  'avl-tree': AvlTree,
  'heuristic-check': HeuristicCheck,
}

const PREVIEW_ALL = import.meta.env.VITE_PREVIEW === 'true'
const WEBSITE_URL: string = import.meta.env.VITE_WEBSITE_URL || 'https://mayathedev.com'
const now = new Date()
const visibleAlgos = PREVIEW_ALL
  ? ALGOS
  : ALGOS.filter(a => !a.availableFrom || new Date(a.availableFrom) <= now)

const FALLBACK_ALGO: AlgoId = 'depth-first-search'
const DAY_VIEWS: Partial<Record<number, View>> = {
  21: 'compare',
  23: 'maze',
  24: 'bfs-vs-dfs',
  25: 'coin-change',
  26: 'dijkstra',
  27: 'a-star',
  28: 'topological-sort',
  30: 'trie',
  31: 'sliding-window',
  32: 'two-pointers',
  33: 'monotonic-stack',
  34: 'binary-search-tree',
  35: 'heap',
  36: 'url-shortener',
  37: 'avl-tree',
  39: 'heuristic-check',
}

function isAlgoId(value: string | null): value is AlgoId {
  return value !== null && ALGOS.some((algo) => algo.id === value)
}

function isView(value: string | null): value is View {
  return value === 'compare' || isAlgoId(value)
}

function isAvailableView(view: View): boolean {
  return view === 'compare' || visibleAlgos.some((algo) => algo.id === view)
}

function getDayView(value: string | null): View | null {
  if (value === null) return null

  const day = Number.parseInt(value, 10)
  if (Number.isNaN(day)) return null

  const mappedView = DAY_VIEWS[day]
  return mappedView && isAvailableView(mappedView) ? mappedView : null
}

function getInitialView(): View {
  if (typeof window === 'undefined') return FALLBACK_ALGO

  const params = new URLSearchParams(window.location.search)
  const requestedView = params.get('algo') ?? params.get('view')

  if (isView(requestedView) && isAvailableView(requestedView)) {
    return requestedView
  }

  const dayView = getDayView(params.get('day'))
  if (dayView) {
    return dayView
  }

  return FALLBACK_ALGO
}

const VIEW_OPTIONS = [
  ...visibleAlgos.map(a => ({ value: a.id as View, label: a.label })),
  { value: 'compare' as View, label: 'Compare' },
]

export function App() {
  const [view, setView] = useState<View>(getInitialView)

  const meta = visibleAlgos.find(a => a.id === view)
  const ActiveComponent = view !== 'compare' ? ALGO_COMPONENTS[view as AlgoId] : null

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden">
      <AlgoSelector selected={view} onSelect={setView} algos={visibleAlgos} websiteUrl={WEBSITE_URL} />

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
