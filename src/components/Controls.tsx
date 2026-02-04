type PlayerState = {
  idx: number
  total: number
  playing: boolean
  speed: number
  isDone: boolean
  play: () => void
  pause: () => void
  stepForward: () => void
  reset: () => void
  setSpeed: (speed: number) => void
}

export type LegendItem = { color: string; label: string }

type Props = {
  player: PlayerState
  stepDescription?: string
  legend?: LegendItem[]
  onNewInput?: () => void
}

const SPEED_OPTIONS = [
  { label: '0.5×', value: 800 },
  { label: '1×', value: 400 },
  { label: '2×', value: 200 },
  { label: '4×', value: 80 },
]

export function Controls({ player, stepDescription, legend, onNewInput }: Props) {
  const { idx, total, playing, speed, isDone, play, pause, stepForward, reset, setSpeed } = player

  return (
    <div className="flex flex-col gap-2 px-4 py-3 border-t border-slate-800">
      {/* Step description */}
      <div className="min-h-[18px]">
        {stepDescription ? (
          <p className="text-[11px] text-slate-400 font-mono">{stepDescription}</p>
        ) : (
          <p className="text-[11px] text-slate-600 font-mono">press play to start</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-[2px] bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-100"
          style={{ width: `${total > 1 ? (idx / (total - 1)) * 100 : 0}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Playback buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="px-3 py-1 text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
          >
            reset
          </button>

          {playing ? (
            <button
              onClick={pause}
              className="px-4 py-1 text-xs border border-amber-600 text-amber-400 hover:bg-amber-600/10 transition-colors"
            >
              pause
            </button>
          ) : (
            <button
              onClick={isDone ? reset : play}
              className="px-4 py-1 text-xs border border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 transition-colors"
            >
              {isDone ? 'restart' : 'play'}
            </button>
          )}

          <button
            onClick={stepForward}
            disabled={isDone}
            className="px-3 py-1 text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            step →
          </button>
        </div>

        {/* Speed + legend + step counter + new input */}
        <div className="flex items-center gap-3 flex-wrap">
          {legend && legend.length > 0 && (
            <div className="flex items-center gap-2">
              {legend.map(item => (
                <span key={item.label} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className={`inline-block w-2 h-2 rounded-sm ${item.color}`} />
                  {item.label}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1">
            {SPEED_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSpeed(opt.value)}
                className={`px-2 py-0.5 text-xs transition-colors ${
                  speed === opt.value
                    ? 'border border-emerald-600 text-emerald-400'
                    : 'border border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-600 font-mono">{idx + 1}/{total}</span>

          {onNewInput && (
            <button
              onClick={onNewInput}
              className="px-3 py-1 text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
            >
              new input
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
