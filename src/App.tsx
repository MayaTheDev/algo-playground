import { useState } from 'react'
import { AlgoSelector } from './components/AlgoSelector'
import { BinarySearch } from './algorithms/binary-search/BinarySearch'
import { BubbleSort } from './algorithms/bubble-sort/BubbleSort'
import { MergeSort } from './algorithms/merge-sort/MergeSort'
import { InsertionSort } from './algorithms/insertion-sort/InsertionSort'
import { SelectionSort } from './algorithms/selection-sort/SelectionSort'
import type { AlgoId, AlgoMeta } from './types/algo.types'

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

export function App() {
  const [selected, setSelected] = useState<AlgoId>('binary-search')
  const ActiveComponent = ALGO_COMPONENTS[selected]
  const meta = ALGOS.find(a => a.id === selected)!

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden">
      <AlgoSelector selected={selected} onSelect={setSelected} algos={ALGOS} />

      <div className="flex-1 flex flex-col min-w-0 relative scanline-effect overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-sm neon-text">algo-playground</span>
            <span className="text-slate-600 text-sm">//</span>
            <span className="text-slate-500 text-xs font-mono">maya</span>
          </div>
          <a
            href="https://mayathedev.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors font-mono"
          >
            mayathedev.com ↗
          </a>
        </header>

        {/* Algorithm title */}
        <div className="px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-baseline gap-3">
            <h1 className="text-sm font-mono text-slate-200">{meta.label}</h1>
            <span className="text-xs text-emerald-500 font-mono">{meta.complexity}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{meta.description}</p>
        </div>

        {/* Visualizer */}
        <div className="flex-1 min-h-0">
          <ActiveComponent key={selected} />
        </div>
      </div>
    </div>
  )
}
