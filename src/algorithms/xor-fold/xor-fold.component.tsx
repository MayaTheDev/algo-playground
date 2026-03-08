import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { xorFoldSteps, type XorStep } from './xor-fold.logic'

const LEGEND = [
  { color: 'bg-emerald-500', label: 'current' },
  { color: 'bg-slate-600', label: 'processed' },
]

// ── Binary row: renders each bit with color coding ─────────────────────────
function BitRow({
  bits,
  label,
  role,
}: {
  bits: string
  label: string
  role: 'a' | 'b' | 'result'
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-right font-mono text-[10px] text-slate-500">{label}</span>
      <div className="flex gap-[3px]">
        {bits.split('').map((bit, i) => {
          let cls = 'w-6 h-6 flex items-center justify-center rounded-sm font-mono text-xs border '
          if (role === 'result') {
            cls +=
              bit === '1'
                ? 'border-emerald-600 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-700 bg-slate-900 text-slate-600'
          } else {
            cls += 'border-slate-700 bg-slate-900 text-slate-300'
          }
          return (
            <div key={i} className={cls}>
              {bit}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── XOR operation panel ─────────────────────────────────────────────────────
function XorPanel({ viz }: { viz: XorStep['xorVisualization'] }) {
  if (!viz) return null
  return (
    <div className="rounded border border-slate-800 bg-slate-950/60 p-4 space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">bit-by-bit xor</p>
      <BitRow bits={viz.a} label="A (accum)" role="a" />
      <BitRow bits={viz.b} label="B (value)" role="b" />
      {/* divider */}
      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0" />
        <div className="flex-1 h-px bg-slate-700" />
      </div>
      <BitRow bits={viz.result} label="A ⊕ B" role="result" />
      <p className="text-[10px] text-slate-500 mt-2 ml-[88px]">
        <span className="inline-block w-3 h-3 rounded-sm border border-slate-700 bg-slate-900 mr-1 align-middle" />
        same bits → 0
        <span className="inline-block w-3 h-3 rounded-sm border border-emerald-600 bg-emerald-500/20 ml-3 mr-1 align-middle" />
        different bits → 1
      </p>
    </div>
  )
}

// ── Array display ───────────────────────────────────────────────────────────
function ArrayDisplay({ step }: { step: XorStep }) {
  const { array, binaryArray, currentIndex, phase } = step
  return (
    <div className="rounded border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">array</p>
      <div className="flex gap-3 flex-wrap">
        {array.map((val, i) => {
          const isCurrent = currentIndex === i
          const isProcessed = phase === 'fold' && currentIndex !== null && i < currentIndex
          const isDone = phase === 'result'

          let cardCls =
            'flex flex-col items-center gap-1 rounded border p-2 min-w-[56px] transition-colors '
          if (isCurrent) {
            cardCls += 'border-emerald-500 bg-emerald-500/10'
          } else if (isProcessed || isDone) {
            cardCls += 'border-slate-800 bg-slate-900 opacity-40'
          } else {
            cardCls += 'border-slate-700 bg-slate-900'
          }

          return (
            <div key={i} className={cardCls}>
              <span
                className={`font-mono text-lg font-bold ${
                  isCurrent ? 'text-emerald-300' : 'text-slate-300'
                }`}
              >
                {val}
              </span>
              <span className="font-mono text-[9px] tracking-wider text-slate-600">
                {binaryArray[i]}
              </span>
              <span className="text-[9px] text-slate-700">[{i}]</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Accumulator display ─────────────────────────────────────────────────────
function AccumulatorDisplay({ step }: { step: XorStep }) {
  const { accumulator, accumulatorBinary, phase } = step
  const isResult = phase === 'result'

  return (
    <div
      className={`rounded border p-4 transition-colors ${
        isResult
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-800 bg-slate-950/60'
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">
        {isResult ? 'result' : 'accumulator'}
      </p>
      <div className="flex items-center gap-4">
        <span
          className={`font-mono text-3xl font-bold ${
            isResult ? 'text-emerald-300' : 'text-slate-200'
          }`}
        >
          {accumulator}
        </span>
        <div className="flex flex-col gap-1">
          <div className="flex gap-[3px]">
            {accumulatorBinary.split('').map((bit, i) => (
              <div
                key={i}
                className={`w-6 h-6 flex items-center justify-center rounded-sm font-mono text-xs border ${
                  bit === '1'
                    ? isResult
                      ? 'border-emerald-600 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-500 bg-slate-700/60 text-slate-200'
                    : 'border-slate-800 bg-slate-900/60 text-slate-700'
                }`}
              >
                {bit}
              </div>
            ))}
          </div>
          <span className="font-mono text-[9px] text-slate-600 ml-1">8-bit binary</span>
        </div>
      </div>
      {isResult && (
        <p className="mt-2 text-xs text-emerald-400">
          Pairs cancelled · unique element survives
        </p>
      )}
    </div>
  )
}

// ── XOR properties intro card ───────────────────────────────────────────────
function IntroCard({ phase }: { phase: XorStep['phase'] }) {
  if (phase !== 'intro') return null
  return (
    <div className="rounded border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">xor properties</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { expr: 'a ⊕ a = 0', note: 'self-cancels' },
          { expr: 'a ⊕ 0 = a', note: 'identity' },
          { expr: 'commutative', note: 'order irrelevant' },
        ].map(({ expr, note }) => (
          <div key={expr} className="rounded border border-slate-800 bg-slate-900/60 p-2 text-center">
            <p className="font-mono text-sm text-emerald-300">{expr}</p>
            <p className="text-[10px] text-slate-600 mt-1">{note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export function XorFold() {
  const steps = useMemo(() => collectSteps(xorFoldSteps()), [])
  const player = useAlgoPlayer(steps)
  const step = player.currentStep

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <ArrayDisplay step={step} />
          <IntroCard phase={step.phase} />
          {step.xorVisualization && <XorPanel viz={step.xorVisualization} />}
          <AccumulatorDisplay step={step} />
        </div>
      </div>
      <Controls player={player} stepDescription={step.description} legend={LEGEND} />
    </div>
  )
}
