import { useMemo } from 'react'
import { MonoStackView } from '../../components/mono-stack-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { monotonicStackSteps } from './monotonic-stack.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'current' },
  { color: 'bg-sky-900', label: 'in stack' },
  { color: 'bg-slate-700', label: 'answered' },
]

export function MonotonicStack() {
  const steps = useMemo(() => collectSteps(monotonicStackSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <MonoStackView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
