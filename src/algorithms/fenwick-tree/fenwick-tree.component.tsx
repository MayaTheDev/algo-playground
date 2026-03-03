import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { fenwickTreeSteps, type FenwickStep } from './fenwick-tree.logic'

const LEGEND = [
  { color: 'bg-emerald-500', label: 'query path' },
  { color: 'bg-amber-500', label: 'update path' },
  { color: 'bg-sky-500', label: 'active index' },
]

// Compute how many elements each BIT cell covers: lsb(i)
function lsb(i: number): number {
  return i & -i
}

function BinaryDisplay({ binaryRepr }: { binaryRepr: string | null }) {
  if (!binaryRepr) return null

  // Highlight the lowest set bit
  const lastOneIdx = binaryRepr.lastIndexOf('1')

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-slate-500 font-mono mr-1">bin:</span>
      {binaryRepr.split('').map((bit, i) => (
        <span
          key={i}
          className={`font-mono text-sm px-1 rounded ${
            i === lastOneIdx
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : bit === '1'
              ? 'text-slate-300'
              : 'text-slate-600'
          }`}
        >
          {bit}
        </span>
      ))}
      {lastOneIdx >= 0 && (
        <span className="text-[10px] text-amber-500 font-mono ml-1">
          ← lsb
        </span>
      )}
    </div>
  )
}

function FenwickView({ step }: { step: FenwickStep }) {
  const { original, tree, phase, activeIndex, visitedIndices, queryResult } = step
  const n = original.length

  // Determine cell color for BIT array (1-indexed, index 0 unused)
  function treeColor(i: number): string {
    if (activeIndex === i) return 'border-sky-400 bg-sky-500/15 text-sky-300'
    if (visitedIndices.includes(i)) {
      return phase === 'update'
        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
        : 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
    }
    return 'border-slate-700 bg-slate-900 text-slate-300'
  }

  // Determine cell color for original array (0-indexed)
  function origColor(i: number): string {
    const bitIndex = i + 1
    if (activeIndex === bitIndex) return 'border-sky-400 bg-sky-500/15 text-sky-300'
    if (visitedIndices.includes(bitIndex)) {
      return phase === 'update'
        ? 'border-amber-500/60 bg-amber-500/5 text-amber-400'
        : 'border-emerald-500/60 bg-emerald-500/5 text-emerald-400'
    }
    return 'border-slate-700 bg-slate-900 text-slate-400'
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Phase badge */}
      <div className="flex items-center gap-3">
        <span
          className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border ${
            phase === 'build'
              ? 'border-slate-600 text-slate-400'
              : phase === 'update'
              ? 'border-amber-600 text-amber-400'
              : 'border-emerald-600 text-emerald-400'
          }`}
        >
          {phase}
        </span>
        {queryResult !== null && (
          <span className="text-[11px] font-mono text-slate-400">
            result ={' '}
            <span className="text-emerald-400 text-sm font-bold">{queryResult}</span>
          </span>
        )}
      </div>

      {/* BIT array — 1-indexed, skip index 0 */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">
          BIT array (1-indexed)
        </p>

        {/* Range brackets above cells */}
        <div className="flex gap-1 mb-1 ml-0">
          {Array.from({ length: n }, (_, i) => {
            const idx = i + 1
            const span = lsb(idx) // how many elements this cell covers
            return (
              <div
                key={idx}
                className="flex flex-col items-center"
                style={{ width: '2.75rem' }}
              >
                <span className="text-[9px] font-mono text-slate-600">
                  [{idx - span + 1}–{idx}]
                </span>
                <div
                  className={`h-px w-full mt-0.5 ${
                    visitedIndices.includes(idx) || activeIndex === idx
                      ? phase === 'update'
                        ? 'bg-amber-500/50'
                        : 'bg-emerald-500/50'
                      : 'bg-slate-800'
                  }`}
                />
              </div>
            )
          })}
        </div>

        {/* BIT cells */}
        <div className="flex gap-1">
          {Array.from({ length: n }, (_, i) => {
            const idx = i + 1
            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center border rounded h-11 transition-all duration-150 ${treeColor(idx)}`}
                style={{ width: '2.75rem', minWidth: '2.75rem' }}
              >
                <span className="text-[9px] text-slate-600 font-mono">[{idx}]</span>
                <span className="text-sm font-mono font-semibold">{tree[idx]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Connector lines */}
      <div className="flex gap-1">
        {Array.from({ length: n }, (_, i) => {
          const idx = i + 1
          const isActive = activeIndex === idx || visitedIndices.includes(idx)
          return (
            <div
              key={idx}
              className="flex justify-center"
              style={{ width: '2.75rem', minWidth: '2.75rem' }}
            >
              <div
                className={`w-px h-4 transition-colors duration-150 ${
                  isActive
                    ? phase === 'update'
                      ? 'bg-amber-500/60'
                      : 'bg-emerald-500/60'
                    : 'bg-slate-800'
                }`}
              />
            </div>
          )
        })}
      </div>

      {/* Original array */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">
          original array (0-indexed)
        </p>
        <div className="flex gap-1">
          {original.map((val, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center border rounded h-11 transition-all duration-150 ${origColor(i)}`}
              style={{ width: '2.75rem', minWidth: '2.75rem' }}
            >
              <span className="text-[9px] text-slate-600 font-mono">[{i}]</span>
              <span className="text-sm font-mono font-semibold">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Binary representation */}
      <div className="rounded border border-slate-800 bg-slate-950/60 px-4 py-3 min-h-[3rem] flex items-center">
        {step.binaryRepr ? (
          <BinaryDisplay binaryRepr={step.binaryRepr} />
        ) : (
          <span className="text-[10px] text-slate-700 font-mono">
            binary representation of active index shown here
          </span>
        )}
      </div>
    </div>
  )
}

export function FenwickTree() {
  const steps = useMemo(() => collectSteps(fenwickTreeSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <FenwickView step={player.currentStep} />
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
      />
    </div>
  )
}
