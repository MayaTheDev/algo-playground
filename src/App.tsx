import { useState } from 'react'
import { AlgoSelector } from './components/AlgoSelector'
import { CompareView } from './components/CompareView'
import { BinarySearch } from './algorithms/binary-search/BinarySearch'
import { BubbleSort } from './algorithms/bubble-sort/BubbleSort'
import { MergeSort } from './algorithms/merge-sort/MergeSort'
import { InsertionSort } from './algorithms/insertion-sort/InsertionSort'
import { SelectionSort } from './algorithms/selection-sort/SelectionSort'
import type { AlgoId, AlgoMeta } from './types/algo.types'

type View = AlgoId | 'compare'

const ALGOS: AlgoMeta[] = [
  {
    id: 'binary-search',
    label: 'Binary Search',
    tag: '#BinarySearch',
    complexity: 'O(log n)',
    description: 'Divide a sorted array in half each step to find a target.',
  },
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
]

const ALGO_COMPONENTS: Record<AlgoId, React.ComponentType> = {
  'binary-search': BinarySearch,
  'bubble-sort': BubbleSort,
  'merge-sort': MergeSort,
  'insertion-sort': InsertionSort,
  'selection-sort': SelectionSort,
}

const VIEW_OPTIONS = [
  ...ALGOS.map(a => ({ value: a.id as View, label: a.label })),
  { value: 'compare' as View, label: 'Compare' },
]

export function App() {
  const [view, setView] = useState<View>('binary-search')

  const meta = ALGOS.find(a => a.id === view)
  const ActiveComponent = view !== 'compare' ? ALGO_COMPONENTS[view as AlgoId] : null

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden">
      <AlgoSelector selected={view} onSelect={setView} algos={ALGOS} />

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
