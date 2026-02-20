import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { heapSteps, type HeapStep } from './heap.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'active' },
  { color: 'bg-amber-400', label: 'compare' },
  { color: 'bg-slate-600', label: 'extracted' },
]

type PositionedNode = { value: number; index: number; x: number; y: number }

function positionHeap(heap: number[]): PositionedNode[] {
  return heap.map((value, index) => {
    const level = Math.floor(Math.log2(index + 1))
    const levelStart = 2 ** level - 1
    const pos = index - levelStart
    const slots = 2 ** level
    return {
      value,
      index,
      x: 10 + ((pos + 0.5) / slots) * 80,
      y: 16 + level * 20,
    }
  })
}

function HeapView({ step }: { step: HeapStep }) {
  const nodes = positionHeap(step.heap)

  return (
    <div className="w-full max-w-3xl space-y-4">
      <svg viewBox="0 0 100 80" className="w-full max-w-xl mx-auto">
        <rect x={0} y={0} width={100} height={80} fill="#020617" />

        {nodes.map((node) => {
          const left = nodes.find((candidate) => candidate.index === node.index * 2 + 1)
          const right = nodes.find((candidate) => candidate.index === node.index * 2 + 2)
          return (
            <g key={`edge-${node.index}`}>
              {left && <line x1={node.x} y1={node.y} x2={left.x} y2={left.y} stroke="#1e293b" strokeWidth={0.6} />}
              {right && <line x1={node.x} y1={node.y} x2={right.x} y2={right.y} stroke="#1e293b" strokeWidth={0.6} />}
            </g>
          )
        })}

        {nodes.map((node) => {
          const isActive = node.index === step.activeIndex
          const isCompare = node.index === step.compareIndex
          const fill = isActive ? '#34d399' : isCompare ? '#f59e0b' : '#0f172a'
          const stroke = isActive ? '#34d399' : isCompare ? '#f59e0b' : '#334155'
          const text = isActive ? '#020617' : '#e2e8f0'

          return (
            <g key={node.index}>
              <circle cx={node.x} cy={node.y} r={5.5} fill={fill} stroke={stroke} strokeWidth={0.7} />
              <text x={node.x} y={node.y + 1.7} textAnchor="middle" fontSize="3.2" fontFamily="monospace" fill={text}>
                {node.value}
              </text>
              <text x={node.x} y={node.y - 8} textAnchor="middle" fontSize="2.2" fontFamily="monospace" fill="#475569">
                {node.index}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
        <div className="border border-slate-800 bg-slate-950/40 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">heap array</p>
          <div className="flex flex-wrap gap-2">
            {step.heap.map((value, index) => {
              const isActive = index === step.activeIndex
              const isCompare = index === step.compareIndex
              return (
                <div
                  key={index}
                  className={`min-w-12 border px-3 py-2 text-center font-mono text-sm ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : isCompare
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 text-slate-300'
                  }`}
                >
                  <div>{value}</div>
                  <div className="text-[10px] text-slate-600">{index}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-950/40 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">extracted mins</p>
          <div className="flex flex-wrap gap-2">
            {step.extracted.length === 0 ? (
              <span className="font-mono text-xs text-slate-600">none yet</span>
            ) : (
              step.extracted.map((value, index) => (
                <div key={index} className="border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-300">
                  {value}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Heap() {
  const steps = useMemo(() => collectSteps(heapSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        <HeapView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
