import { useMemo } from 'react'
import { WindowView } from '../../components/window-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { slidingWindowSteps } from './sliding-window.logic'

const LEGEND = [
  { color: 'bg-emerald-500', label: 'window' },
  { color: 'bg-amber-500', label: 'best' },
]

export function SlidingWindow() {
  const steps = useMemo(() => collectSteps(slidingWindowSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <WindowView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
