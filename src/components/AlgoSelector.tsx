import type { AlgoId, AlgoMeta } from '../types/algo.types'

type View = AlgoId | 'compare'

type Props = {
  selected: View
  onSelect: (id: View) => void
  algos: AlgoMeta[]
}

export function AlgoSelector({ selected, onSelect, algos }: Props) {
  return (
    <aside className="w-48 shrink-0 border-r border-slate-800 flex-col overflow-y-auto hidden md:flex">
      <div className="px-3 py-3 border-b border-slate-800">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest">algorithms</p>
      </div>

      <nav className="flex flex-col py-1">
        {algos.map(algo => (
          <button
            key={algo.id}
            onClick={() => onSelect(algo.id)}
            className={`text-left px-3 py-2.5 text-xs transition-colors border-l-2 ${
              selected === algo.id
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="block font-mono">{algo.label}</span>
            <span className="block text-[10px] text-slate-600 mt-0.5">{algo.complexity}</span>
          </button>
        ))}

        <div className="mx-3 my-2 border-t border-slate-800" />

        <button
          onClick={() => onSelect('compare')}
          className={`text-left px-3 py-2.5 text-xs transition-colors border-l-2 ${
            selected === 'compare'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span className="block font-mono">Compare</span>
          <span className="block text-[10px] text-slate-600 mt-0.5">side by side</span>
        </button>
      </nav>
    </aside>
  )
}
