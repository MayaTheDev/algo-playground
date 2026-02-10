import { useState, useMemo } from 'react'
import { DpTableView } from '../../components/dp-table-view.component'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { coinChangeSteps, generateTarget } from './coin-change.logic'

const LEGEND = [
  { color: 'bg-emerald-500', label: 'current' },
  { color: 'bg-amber-500', label: 'comparing' },
  { color: 'bg-emerald-900', label: 'filled' },
]

export function CoinChange() {
  const [input, setInput] = useState(() => generateTarget())

  const steps = useMemo(
    () => collectSteps(coinChangeSteps(input.coins, input.amount)),
    [input],
  )
  const player = useAlgoPlayer(steps)

  const handleNewInput = () => {
    player.reset()
    setInput(generateTarget())
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-4 text-center">
            <span className="text-xs text-slate-500 font-mono">amount: </span>
            <span className="text-lg font-mono text-emerald-400">{input.amount}</span>
          </div>
          <DpTableView step={player.currentStep} />
        </div>
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
        onNewInput={handleNewInput}
      />
    </div>
  )
}
