import { useMemo } from 'react'
import { TwoPointerView } from '../../components/two-pointer-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { twoPointersSteps } from './two-pointers.logic'

const LEGEND = [
  { color: 'bg-sky-400', label: 'left' },
  { color: 'bg-amber-500', label: 'right' },
  { color: 'bg-emerald-400', label: 'found' },
]

export function TwoPointers() {
  const steps = useMemo(() => collectSteps(twoPointersSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <TwoPointerView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
