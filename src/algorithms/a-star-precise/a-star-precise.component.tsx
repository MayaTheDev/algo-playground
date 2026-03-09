import { useEffect, useMemo, useState } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  MODES,
  OPTIMAL_COST,
  aStarPreciseSteps,
  modeMeta,
  summarizeMode,
  type AStarPreciseStep,
  type HeuristicMode,
  type PreciseCell,
  type RelaxKind,
} from './a-star-precise.logic'

const LEGEND = [
  { color: 'bg-sky-400', label: 'g — spent' },
  { color: 'bg-amber-400', label: 'h — guessed' },
  { color: 'bg-emerald-900', label: 'frontier' },
  { color: 'bg-indigo-900', label: 'settled' },
  { color: 'bg-emerald-400', label: 'path' },
]

// ─── Grid ────────────────────────────────────────────────────────────────────

const CELL = 20
const PAD = 2

const STATE_FILL: Record<string, string> = {
  empty: '#0b1220',
  wall: '#1e293b',
  start: '#075985',
  end: '#78350f',
  open: '#052e1a',
  closed: '#1e1b4b',
  path: '#064e3b',
}

const STATE_STROKE: Record<string, string> = {
  empty: '#111c30',
  wall: '#1e293b',
  start: '#38bdf8',
  end: '#f59e0b',
  open: '#34d399',
  closed: '#4f46e5',
  path: '#34d399',
}

function PreciseGridView({ step }: { step: AStarPreciseStep }) {
  const { grid, current } = step
  const rows = grid.length
  const cols = grid[0].length
  const w = cols * CELL + PAD * 2
  const h = rows * CELL + PAD * 2

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[720px] mx-auto">
      <rect x={0} y={0} width={w} height={h} fill="#020617" />

      {grid.flatMap(row =>
        row.map((cell: PreciseCell) => {
          const x = PAD + cell.col * CELL
          const y = PAD + cell.row * CELL
          const isCurrent = current !== null && current[0] === cell.row && current[1] === cell.col
          const reached = Number.isFinite(cell.g) && cell.state !== 'wall'

          return (
            <g key={`${cell.row}-${cell.col}`}>
              <rect
                x={x + 0.5}
                y={y + 0.5}
                width={CELL - 1}
                height={CELL - 1}
                fill={STATE_FILL[cell.state] ?? '#0b1220'}
                stroke={isCurrent ? '#facc15' : STATE_STROKE[cell.state] ?? '#111c30'}
                strokeWidth={isCurrent ? 1.4 : 0.5}
                rx={1}
              >
                {reached && (
                  <title>
                    {`(${cell.row},${cell.col}) — g=${cell.g} spent, h=${cell.h} guessed, f=${cell.f}`}
                  </title>
                )}
              </rect>

              {reached && (
                <>
                  {/* g — the fact, top left */}
                  <text
                    x={x + 2.4}
                    y={y + 6.6}
                    fontSize={4.6}
                    fontFamily="monospace"
                    fill="#7dd3fc"
                  >
                    {cell.g}
                  </text>
                  {/* h — the guess, top right */}
                  <text
                    x={x + CELL - 2.4}
                    y={y + 6.6}
                    textAnchor="end"
                    fontSize={4.6}
                    fontFamily="monospace"
                    fill="#fbbf24"
                  >
                    {cell.h}
                  </text>
                  {/* f — the sum they get argued down to, bottom centre */}
                  <text
                    x={x + CELL / 2}
                    y={y + CELL - 3.4}
                    textAnchor="middle"
                    fontSize={6.4}
                    fontFamily="monospace"
                    fontWeight={isCurrent ? 'bold' : 'normal'}
                    fill={cell.state === 'path' ? '#6ee7b7' : isCurrent ? '#fde68a' : '#94a3b8'}
                  >
                    {cell.f}
                  </text>
                </>
              )}

              {cell.state === 'start' && !reached && (
                <text
                  x={x + CELL / 2}
                  y={y + CELL / 2 + 2}
                  textAnchor="middle"
                  fontSize={6}
                  fontFamily="monospace"
                  fill="#7dd3fc"
                >
                  S
                </text>
              )}
              {cell.state === 'end' && !reached && (
                <text
                  x={x + CELL / 2}
                  y={y + CELL / 2 + 2}
                  textAnchor="middle"
                  fontSize={6}
                  fontFamily="monospace"
                  fill="#fbbf24"
                >
                  G
                </text>
              )}
            </g>
          )
        }),
      )}
    </svg>
  )
}

// ─── Cost ledger — the whole point of the day ────────────────────────────────

function CostLedger({ step }: { step: AStarPreciseStep }) {
  const cell = step.current ? step.grid[step.current[0]][step.current[1]] : null

  const rows: { symbol: string; kind: string; value: string; color: string; blurb: string }[] = [
    {
      symbol: 'g',
      kind: 'fact',
      value: cell && Number.isFinite(cell.g) ? String(cell.g) : '—',
      color: 'text-sky-300',
      blurb: 'steps actually walked to get here — counted, not predicted',
    },
    {
      symbol: 'h',
      kind: 'guess',
      value: cell ? String(cell.h) : '—',
      color: 'text-amber-300',
      blurb: 'estimate of what is left — never verified, only trusted',
    },
    {
      symbol: 'f',
      kind: 'g + h',
      value: cell && Number.isFinite(cell.f) ? String(cell.f) : '—',
      color: 'text-slate-200',
      blurb: 'the number the queue sorts on — one fact and one guess, added',
    },
  ]

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
        cost ledger{step.current ? ` — (${step.current[0]},${step.current[1]})` : ''}
      </p>
      <div className="space-y-1.5">
        {rows.map(row => (
          <div key={row.symbol} className="flex items-start gap-2">
            <span className={`font-mono text-lg leading-none ${row.color}`}>{row.symbol}</span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs">
                <span className={row.color}>{row.value}</span>
                <span className="ml-2 text-slate-600">{row.kind}</span>
              </p>
              <p className="text-[10px] leading-snug text-slate-500">{row.blurb}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Frontier table ──────────────────────────────────────────────────────────

const FRONTIER_ROWS = 7

function FrontierTable({ step }: { step: AStarPreciseStep }) {
  const shown = step.frontier.slice(0, FRONTIER_ROWS)
  const hidden = step.frontier.length - shown.length

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
        frontier — {step.frontier.length} open
      </p>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 font-mono text-[10px]">
        <span className="text-slate-600">cell</span>
        <span className="text-right text-sky-500">g</span>
        <span className="text-right text-amber-500">h</span>
        <span className="text-right text-slate-500">f</span>
        {shown.map((entry, i) => (
          <div key={`${entry.row}-${entry.col}`} className="contents">
            <span className={i === 0 ? 'text-emerald-300' : 'text-slate-500'}>
              {i === 0 ? '▸ ' : '  '}({entry.row},{entry.col})
            </span>
            <span className="text-right text-sky-300">{entry.g}</span>
            <span className="text-right text-amber-300">{entry.h}</span>
            <span className={`text-right ${i === 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
              {entry.f}
            </span>
          </div>
        ))}
      </div>
      {shown.length === 0 && <p className="font-mono text-[10px] text-slate-700">empty</p>}
      {hidden > 0 && (
        <p className="mt-1.5 font-mono text-[10px] text-slate-700">+{hidden} more, higher f</p>
      )}
    </div>
  )
}

// ─── Relaxation log ──────────────────────────────────────────────────────────

const RELAX_COLORS: Record<RelaxKind, string> = {
  discovered: 'text-emerald-400',
  improved: 'text-sky-300',
  reopened: 'text-violet-300',
  rejected: 'text-slate-600',
}

function RelaxPanel({ step }: { step: AStarPreciseStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">neighbour relaxation</p>
      {step.relaxed.length === 0 ? (
        <p className="font-mono text-[10px] text-slate-700">—</p>
      ) : (
        <div className="space-y-1">
          {step.relaxed.map(r => (
            <p key={`${r.row}-${r.col}`} className={`font-mono text-[10px] ${RELAX_COLORS[r.kind]}`}>
              ({r.row},{r.col}) {r.kind} — {r.note}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Trade-off table ─────────────────────────────────────────────────────────

function TradeoffTable({ mode }: { mode: HeuristicMode }) {
  const summaries = useMemo(() => MODES.map(m => summarizeMode(m.id)), [])

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
        the trade-off — shortest path costs {OPTIMAL_COST}
      </p>
      <div className="space-y-1.5">
        {summaries.map(summary => {
          const meta = modeMeta(summary.mode)
          const active = summary.mode === mode
          return (
            <div
              key={summary.mode}
              className={`rounded border px-2 py-1.5 font-mono text-[10px] ${
                active
                  ? 'border-emerald-700 bg-emerald-500/5 text-emerald-300'
                  : 'border-slate-800 text-slate-500'
              }`}
            >
              <p className="font-bold">
                {meta.label} <span className="font-normal text-slate-600">{meta.formula}</span>
              </p>
              <p className="text-[10px] text-slate-500">
                expanded <span className="text-slate-300">{summary.expanded}</span> cells · path cost{' '}
                <span className={summary.optimal ? 'text-emerald-400' : 'text-rose-400'}>
                  {summary.pathCost ?? '—'}
                </span>
              </p>
              <p className={`text-[10px] ${summary.optimal ? 'text-slate-600' : 'text-rose-400'}`}>
                {summary.optimal
                  ? 'shortest path'
                  : `${(summary.pathCost ?? 0) - OPTIMAL_COST} steps longer than the shortest path`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── View ────────────────────────────────────────────────────────────────────

function AStarPreciseView({
  step,
  mode,
  onMode,
}: {
  step: AStarPreciseStep
  mode: HeuristicMode
  onMode: (mode: HeuristicMode) => void
}) {
  const meta = modeMeta(mode)
  const gap = step.pathCost === null ? null : step.pathCost - step.optimalCost

  return (
    <div className="w-full space-y-4">
      {/* Heuristic selector */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-600">heuristic</span>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => onMode(m.id)}
              className={`px-2.5 py-1 font-mono text-[11px] border transition-colors ${
                m.id === mode
                  ? 'border-emerald-600 bg-emerald-500/5 text-emerald-400'
                  : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {m.formula}
            </button>
          ))}
          <span
            className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border ${
              meta.admissible
                ? 'border-emerald-800 text-emerald-500'
                : 'border-rose-800 text-rose-400'
            }`}
          >
            {meta.admissible ? 'admissible' : 'inadmissible'}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">{meta.claim}</p>
      </div>

      {/* Running tally */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-slate-800 bg-slate-950/40 px-3 py-2 font-mono text-[11px]">
        <span className="text-slate-600">
          expanded <span className="text-slate-200">{step.expanded}</span>
        </span>
        <span className="text-slate-600">
          frontier <span className="text-slate-200">{step.frontier.length}</span>
        </span>
        <span className="text-slate-600">
          path cost{' '}
          <span className={gap === null ? 'text-slate-500' : gap === 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {step.pathCost ?? 'searching'}
          </span>
        </span>
        <span className="text-slate-600">
          shortest possible <span className="text-slate-300">{step.optimalCost}</span>
        </span>
        {gap !== null && gap > 0 && (
          <span className="text-rose-400">
            the search returned a path {gap} steps longer and reported no error
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="rounded border border-slate-800 bg-slate-950/30 p-3">
        <PreciseGridView step={step} />
        <p className="mt-2 text-center font-mono text-[10px] text-slate-600">
          each cell: <span className="text-sky-400">g</span> top-left ·{' '}
          <span className="text-amber-400">h</span> top-right ·{' '}
          <span className="text-slate-400">f</span> below
        </p>
      </div>

      {/* Panels */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <CostLedger step={step} />
          <RelaxPanel step={step} />
        </div>
        <FrontierTable step={step} />
        <div className="space-y-4">
          <TradeoffTable mode={mode} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              why split them
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              A single f score hides which half is lying. When a search takes the wrong route, g is
              never at fault — it is a count of steps already taken. Every pathfinding bug worth the
              name lives in h.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AStarPrecise() {
  const [mode, setMode] = useState<HeuristicMode>('manhattan')
  const steps = useMemo(() => collectSteps(aStarPreciseSteps(mode)), [mode])
  const player = useAlgoPlayer(steps)
  const { reset } = player

  // Switching the heuristic is a different search — start it from the top.
  useEffect(() => {
    reset()
  }, [mode, reset])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <AStarPreciseView step={player.currentStep} mode={mode} onMode={setMode} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
