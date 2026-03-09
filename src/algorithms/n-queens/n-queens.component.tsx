import { useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  BOARD_SIZES,
  nQueensSteps,
  rowSpace,
  searchStats,
  totalPlacements,
  type BoardSize,
  type NQueensStep,
} from './n-queens.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'queen' },
  { color: 'bg-slate-600', label: 'attacked' },
  { color: 'bg-sky-400', label: 'trying' },
  { color: 'bg-rose-500', label: 'rejected' },
]

const ACTION_LABELS: Record<NQueensStep['action'], string> = {
  start: 'setup',
  place: 'place',
  reject: 'reject · prune',
  backtrack: 'back out',
  solution: 'solution found',
  exhausted: 'branch dead',
  done: 'done',
}

const ACTION_COLORS: Record<NQueensStep['action'], string> = {
  start: 'text-slate-400 border-slate-700',
  place: 'text-emerald-400 border-emerald-800',
  reject: 'text-rose-400 border-rose-800',
  backtrack: 'text-amber-400 border-amber-800',
  solution: 'text-emerald-300 border-emerald-600',
  exhausted: 'text-rose-400 border-rose-800',
  done: 'text-slate-400 border-slate-700',
}

// ── Board ────────────────────────────────────────────────────────────────────

function Board({ step }: { step: NQueensStep }) {
  const { n, board, row, col, action, attacked, conflict } = step
  const cell = 100 / n

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-[300px] mx-auto">
      {Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, c) => {
          const light = (r + c) % 2 === 0
          const hasQueen = board[r] === c
          const isAttacked = attacked.includes(`${r},${c}`)
          const isTrying = row === r && col === c && action === 'place'
          const isRejected = row === r && col === c && action === 'reject'
          const isBacktrack = row === r && col === c && action === 'backtrack'
          const isVeto = conflict !== null && conflict.row === r && conflict.col === c

          let fill = light ? '#0f172a' : '#111f33'
          if (isRejected) fill = '#4c0519'
          else if (isBacktrack) fill = '#451a03'
          else if (isTrying) fill = '#0c4a6e'
          else if (isAttacked && !hasQueen) fill = light ? '#16202f' : '#1a2739'

          return (
            <g key={`${r}-${c}`}>
              <rect
                x={c * cell} y={r * cell}
                width={cell} height={cell}
                fill={fill}
                stroke={isVeto ? '#f43f5e' : '#020617'}
                strokeWidth={isVeto ? 0.8 : 0.3}
              />
              {isAttacked && !hasQueen && !isRejected && (
                <circle
                  cx={c * cell + cell / 2}
                  cy={r * cell + cell / 2}
                  r={cell * 0.06}
                  fill="#475569"
                />
              )}
              {hasQueen && (
                <text
                  x={c * cell + cell / 2}
                  y={r * cell + cell / 2 + cell * 0.18}
                  textAnchor="middle"
                  fontSize={cell * 0.55}
                  fontFamily="monospace"
                  fill={isVeto ? '#fb7185' : '#34d399'}
                  fontWeight="bold"
                >
                  Q
                </text>
              )}
              {isRejected && (
                <text
                  x={c * cell + cell / 2}
                  y={r * cell + cell / 2 + cell * 0.18}
                  textAnchor="middle"
                  fontSize={cell * 0.5}
                  fontFamily="monospace"
                  fill="#fb7185"
                >
                  ×
                </text>
              )}
            </g>
          )
        }),
      )}

      {/* Active row marker */}
      {action !== 'done' && action !== 'start' && (
        <rect
          x={0} y={row * cell}
          width={100} height={cell}
          fill="none"
          stroke={action === 'reject' ? '#f43f5e' : action === 'backtrack' ? '#f59e0b' : '#38bdf8'}
          strokeWidth={0.6}
          opacity={0.8}
        />
      )}
    </svg>
  )
}

// ── Decision stack: place / evaluate / fail / back out ───────────────────────

function DecisionStack({ step }: { step: NQueensStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">
        decision stack · row → column
      </p>
      <div className="space-y-1">
        {Array.from({ length: step.n }, (_, r) => {
          const c = step.board[r]
          const isCurrent = step.row === r && step.action !== 'done'
          return (
            <div
              key={r}
              className={`flex items-center justify-between rounded px-2 py-1 font-mono text-xs ${
                isCurrent
                  ? step.action === 'reject'
                    ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
                    : step.action === 'backtrack' || step.action === 'exhausted'
                      ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300'
                      : 'border border-sky-500/40 bg-sky-500/10 text-sky-300'
                  : c !== null
                    ? 'text-emerald-400'
                    : 'text-slate-700'
              }`}
            >
              <span>row {r}</span>
              <span>
                {c !== null
                  ? `col ${c}`
                  : isCurrent && step.col !== null
                    ? `trying col ${step.col}`
                    : '—'}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
        Place. Evaluate. Fail. Back out to the last valid state. Try the next thing.
      </p>
    </div>
  )
}

// ── Explored vs pruned ───────────────────────────────────────────────────────

function PruningPanel({ step }: { step: NQueensStep }) {
  const space = rowSpace(step.n)
  const walkedPct = (step.explored / space) * 100
  const exploredShare =
    step.explored === 0 ? 0 : ((step.explored - step.pruned) / step.explored) * 100

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">
        explored vs pruned
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border border-sky-900/60 bg-sky-950/20 p-2">
          <p className="text-[10px] text-slate-500">evaluated</p>
          <p className="font-mono text-lg text-sky-300">{step.explored.toLocaleString()}</p>
        </div>
        <div className="rounded border border-rose-900/60 bg-rose-950/20 p-2">
          <p className="text-[10px] text-slate-500">rejected</p>
          <p className="font-mono text-lg text-rose-300">{step.pruned.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-rose-900/60">
        <div
          className="h-full bg-sky-500 transition-all duration-200"
          style={{ width: `${exploredShare}%` }}
        />
      </div>

      <div className="mt-3 space-y-1 font-mono text-[10px] text-slate-500">
        <p>
          arrangements never walked:{' '}
          <span className="text-amber-300">{step.skipped.toLocaleString()}</span>
        </p>
        <p>
          search tree space (n^n): <span className="text-slate-400">{space.toLocaleString()}</span>
        </p>
        <p>
          brute-force placements C(n²,n):{' '}
          <span className="text-slate-400">{totalPlacements(step.n).toLocaleString()}</span>
        </p>
        <p>
          fraction of search tree touched:{' '}
          <span className="text-emerald-400">
            {walkedPct < 0.01 ? walkedPct.toExponential(2) : walkedPct.toFixed(2)}%
          </span>
        </p>
      </div>
    </div>
  )
}

// ── Pruning at scale ─────────────────────────────────────────────────────────

function ScaleTable({ n }: { n: number }) {
  const rows = useMemo(
    () => BOARD_SIZES.map(size => ({ size, ...searchStats(size) })),
    [],
  )
  const eight = useMemo(() => searchStats(8), [])

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">
        pruning at scale
      </p>
      <div className="mb-1 flex items-center justify-between px-1 font-mono text-[9px] text-slate-600">
        <span className="w-8">n</span>
        <span className="flex-1 text-right">evaluated</span>
        <span className="flex-1 text-right">solutions</span>
        <span className="flex-[1.6] text-right">row-space</span>
      </div>
      <div className="space-y-0.5">
        {rows.map(row => (
          <div
            key={row.size}
            className={`flex items-center justify-between rounded px-1 py-0.5 font-mono text-[10px] ${
              row.size === n ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-500'
            }`}
          >
            <span className="w-8">{row.size}</span>
            <span className="flex-1 text-right">{row.explored.toLocaleString()}</span>
            <span className="flex-1 text-right">{row.solutions}</span>
            <span className="flex-[1.6] text-right text-slate-600">
              {rowSpace(row.size).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
        Eight queens has {eight.solutions} valid arrangements. Any-square brute force would check{' '}
        {eight.total.toLocaleString()} placements; this row-by-row solver works in n^n space and
        evaluates {eight.explored.toLocaleString()} candidates.
      </p>
    </div>
  )
}

// ── Solutions found ──────────────────────────────────────────────────────────

function SolutionList({ step }: { step: NQueensStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">
        solutions found · {step.solutions.length}
      </p>
      <div className="space-y-1">
        {step.solutions.map((sol, i) => (
          <p key={i} className="font-mono text-[11px] text-emerald-400">
            #{i + 1} [{sol.join(', ')}]
          </p>
        ))}
        {step.solutions.length === 0 && (
          <p className="font-mono text-[10px] text-slate-700">still searching</p>
        )}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

function NQueensView({ step }: { step: NQueensStep }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${ACTION_COLORS[step.action]}`}
        >
          {ACTION_LABELS[step.action]}
        </span>
        <span className="font-mono text-[10px] text-slate-600">
          depth {step.board.filter(c => c !== null).length}/{step.n}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,0.7fr)_minmax(260px,0.8fr)]">
        <div className="flex justify-center rounded border border-slate-800 bg-slate-950/30 p-4">
          <Board step={step} />
        </div>

        <div className="min-w-0 space-y-3">
          <DecisionStack step={step} />
          <SolutionList step={step} />
        </div>

        <div className="space-y-3">
          <PruningPanel step={step} />
          <ScaleTable n={step.n} />
        </div>
      </div>
    </div>
  )
}

/** Keyed by board size so switching sizes restarts the run cleanly */
function NQueensRunner({
  size,
  onSelectSize,
}: {
  size: BoardSize
  onSelectSize: (n: BoardSize) => void
}) {
  const steps = useMemo(() => collectSteps(nQueensSteps(size)), [size])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
            board
          </span>
          {BOARD_SIZES.map(n => (
            <button
              key={n}
              onClick={() => onSelectSize(n)}
              className={`px-3 py-1 font-mono text-xs border transition-colors ${
                size === n
                  ? 'border-emerald-600 text-emerald-400'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {n}×{n}
            </button>
          ))}
        </div>
        <NQueensView step={player.currentStep} />
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
      />
    </div>
  )
}

export function NQueens() {
  const [size, setSize] = useState<BoardSize>(5)
  return <NQueensRunner key={size} size={size} onSelectSize={setSize} />
}
