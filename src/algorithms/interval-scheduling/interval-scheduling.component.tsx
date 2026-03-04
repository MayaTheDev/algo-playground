import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { intervalSchedulingSteps } from './interval-scheduling.logic'
import type { IntervalStep } from './interval-scheduling.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'selected' },
  { color: 'bg-red-400', label: 'rejected' },
  { color: 'bg-amber-400', label: 'evaluating' },
  { color: 'bg-slate-600', label: 'pending' },
]

const TIME_MIN = 0
const TIME_MAX = 13

function Timeline({ step }: { step: IntervalStep }) {
  const { intervals, currentIndex, selected, rejected, lastEnd } = step

  const ticks = Array.from({ length: TIME_MAX - TIME_MIN + 1 }, (_, i) => i + TIME_MIN)

  function getBarColor(id: string, index: number): string {
    if (selected.includes(id)) return 'bg-emerald-400'
    if (rejected.includes(id)) return 'bg-red-400 opacity-40'
    if (index === currentIndex) return 'bg-amber-400'
    return 'bg-slate-600'
  }

  function getBorderClass(id: string, index: number): string {
    if (index === currentIndex && !selected.includes(id) && !rejected.includes(id)) {
      return 'ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900'
    }
    if (index === currentIndex && selected.includes(id)) {
      return 'ring-2 ring-emerald-300 ring-offset-1 ring-offset-slate-900'
    }
    return ''
  }

  function getLabelColor(id: string, index: number): string {
    if (selected.includes(id)) return 'text-emerald-300'
    if (rejected.includes(id)) return 'text-slate-600'
    if (index === currentIndex) return 'text-amber-300'
    return 'text-slate-400'
  }

  function timeToPercent(t: number): string {
    return `${((t - TIME_MIN) / (TIME_MAX - TIME_MIN)) * 100}%`
  }

  const totalWidth = TIME_MAX - TIME_MIN

  return (
    <div className="w-full max-w-2xl">
      {/* Timeline rows */}
      <div className="flex flex-col gap-2 mb-4">
        {intervals.map((interval, i) => {
          const leftPct = ((interval.start - TIME_MIN) / totalWidth) * 100
          const widthPct = ((interval.end - interval.start) / totalWidth) * 100
          const isRejected = rejected.includes(interval.id)

          return (
            <div key={interval.id} className="flex items-center gap-3">
              {/* Label */}
              <div className={`w-20 text-right text-[10px] font-mono shrink-0 transition-colors duration-200 ${getLabelColor(interval.id, i)}`}>
                {interval.label.replace('Meeting ', '')}
              </div>

              {/* Bar track */}
              <div className="relative flex-1 h-6">
                {/* Track background */}
                <div className="absolute inset-0 bg-slate-800/50 rounded" />

                {/* Interval bar */}
                <div
                  className={`absolute top-0.5 bottom-0.5 rounded transition-all duration-300 ${getBarColor(interval.id, i)} ${getBorderClass(interval.id, i)}`}
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                >
                  {/* Time labels inside bar if wide enough */}
                  {widthPct > 15 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[9px] font-mono font-bold ${isRejected ? 'text-slate-700' : 'text-slate-900'}`}>
                        {interval.start}–{interval.end}
                      </span>
                    </div>
                  )}

                  {/* Strikethrough for rejected */}
                  {isRejected && (
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-px bg-red-600/70" />
                    </div>
                  )}
                </div>

                {/* Time labels outside bar if too narrow */}
                {widthPct <= 15 && (
                  <div
                    className={`absolute -top-4 text-[9px] font-mono ${isRejected ? 'text-slate-600' : 'text-slate-500'}`}
                    style={{ left: `${leftPct}%` }}
                  >
                    {interval.start}–{interval.end}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time axis */}
      <div className="flex items-center gap-3">
        <div className="w-20 shrink-0" />
        <div className="relative flex-1 h-6">
          {/* Axis line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-slate-700" />

          {/* Tick marks and labels */}
          {ticks.map(t => (
            <div
              key={t}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: timeToPercent(t), transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-2 bg-slate-700" />
              <span className="text-[9px] font-mono text-slate-600 mt-0.5">{t}</span>
            </div>
          ))}

          {/* Last end time marker */}
          {lastEnd !== null && (
            <div
              className="absolute top-0 flex flex-col items-center z-10 transition-all duration-300"
              style={{ left: timeToPercent(lastEnd), transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-5 bg-emerald-500" />
              <span className="text-[8px] font-mono text-emerald-400 whitespace-nowrap -mt-0.5">
                t={lastEnd}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mt-4">
        <div className="w-20 shrink-0" />
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span className="text-emerald-400">
            selected: <span className="font-bold">{step.selected.length}</span>
          </span>
          <span className="text-red-400">
            rejected: <span className="font-bold">{step.rejected.length}</span>
          </span>
          {lastEnd !== null && (
            <span className="text-slate-500">
              last end: <span className="text-emerald-300 font-bold">{lastEnd}</span>
            </span>
          )}
          <span className={`text-slate-500 ${step.sorted ? 'text-emerald-600' : ''}`}>
            {step.sorted ? '✓ sorted by end time' : 'unsorted'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function IntervalScheduling() {
  const steps = useMemo(() => collectSteps(intervalSchedulingSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <Timeline step={player.currentStep} />
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
      />
    </div>
  )
}
