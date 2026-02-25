import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { kmpSteps, type KmpStep } from './kmp.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'current compare' },
  { color: 'bg-sky-400', label: 'matched char' },
  { color: 'bg-amber-400', label: 'pattern shift' },
]

function CharBox({
  value,
  active,
  matched,
}: {
  value: string
  active?: boolean
  matched?: boolean
}) {
  return (
    <div
      className={`h-10 w-10 border text-center font-mono text-sm leading-10 ${
        active
          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
          : matched
            ? 'border-sky-500 bg-sky-500/10 text-sky-300'
            : 'border-slate-800 bg-slate-950/40 text-slate-300'
      }`}
    >
      {value}
    </div>
  )
}

function KmpView({ step }: { step: KmpStep }) {
  return (
    <div className="w-full max-w-4xl space-y-5">
      <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">text</p>
        <div className="flex flex-wrap gap-1">
          {step.text.split('').map((char, index) => (
            <div key={index} className="space-y-1">
              <CharBox value={char} active={step.phase === 'search' && index === step.i} matched={step.matches.includes(index)} />
              <div className="text-center font-mono text-[10px] text-slate-600">{index}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-slate-600">pattern alignment</p>
          <span className="font-mono text-xs text-amber-300">shift = {step.shift}</span>
        </div>
        <div className="flex gap-1" style={{ marginLeft: `${step.shift * 2.75}rem` }}>
          {step.pattern.split('').map((char, index) => (
            <CharBox
              key={index}
              value={char}
              active={index === step.j}
              matched={step.phase === 'search' && index < step.j}
            />
          ))}
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
        <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-600">failure table / lps</p>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex gap-1">
              {step.pattern.split('').map((char, index) => (
                <div key={index} className="w-10 text-center font-mono text-xs text-slate-500">
                  {char}
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {step.lps.map((value, index) => (
                <div
                  key={index}
                  className={`h-10 w-10 border text-center font-mono text-sm leading-10 ${
                    step.phase === 'build' && index === step.i
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
          <div className="font-mono text-xs text-slate-400">
            KMP builds this table first so a mismatch can reuse known prefix/suffix overlap instead of restarting the pattern from index 0.
          </div>
        </div>
      </div>
    </div>
  )
}

export function Kmp() {
  const steps = useMemo(() => collectSteps(kmpSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        <KmpView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
