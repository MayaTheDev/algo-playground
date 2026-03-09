import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import {
  cacheInvalidationSteps,
  strategyTitle,
  type CacheActor,
  type CacheInvalidationStep,
} from './cache-invalidation.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'in sync' },
  { color: 'bg-rose-500', label: 'stale' },
  { color: 'bg-amber-400', label: 'dirty' },
  { color: 'bg-violet-400', label: 'invalidation event' },
]

// ── Topology SVG ─────────────────────────────────────────────────────────────

const BOX: Record<CacheActor, { x: number; y: number; w: number; h: number; label: string }> = {
  'svc-a': { x: 14, y: 12, w: 96, h: 34, label: 'Service A' },
  'svc-b': { x: 194, y: 12, w: 96, h: 34, label: 'Service B' },
  bus: { x: 14, y: 74, w: 276, h: 26, label: 'pub/sub channel' },
  cache: { x: 14, y: 128, w: 276, h: 44, label: 'Redis cache' },
  db: { x: 14, y: 200, w: 276, h: 44, label: 'Database' },
}

const OP_COLORS: Record<string, string> = {
  read: '#38bdf8',
  write: '#f59e0b',
  flush: '#34d399',
  event: '#a78bfa',
  evict: '#f43f5e',
  fill: '#34d399',
}

function center(actor: CacheActor): [number, number] {
  const b = BOX[actor]
  return [b.x + b.w / 2, b.y + b.h / 2]
}

function TopologyView({ step }: { step: CacheInvalidationStep }) {
  const { op, bus, strategy } = step
  const busLive = strategy === 'pub-sub'
  const involved = new Set<CacheActor>(op ? [op.from, op.to] : [])

  return (
    <svg viewBox="0 0 304 258" className="w-full max-w-[340px] mx-auto">
      <defs>
        <marker id="ci-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
        </marker>
      </defs>

      {/* Operation arrow (drawn first so boxes sit on top) */}
      {op && op.from !== op.to && (() => {
        const [x1, y1] = center(op.from)
        const [x2, y2] = center(op.to)
        return (
          <line
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={OP_COLORS[op.kind] ?? '#94a3b8'}
            strokeWidth={1.6}
            strokeDasharray="5 3"
            markerEnd="url(#ci-arrow)"
            opacity={0.9}
          />
        )
      })()}

      {(Object.keys(BOX) as CacheActor[]).map(actor => {
        const b = BOX[actor]
        const active = involved.has(actor)
        const dimmed = actor === 'bus' && !busLive

        let stroke = '#334155'
        let fill = '#0b1220'
        if (active) {
          stroke = OP_COLORS[op?.kind ?? 'read'] ?? '#94a3b8'
          fill = '#111f33'
        } else if (actor === 'bus' && busLive) {
          stroke = '#7c3aed'
        }

        return (
          <g key={actor} opacity={dimmed ? 0.35 : 1}>
            <rect
              x={b.x} y={b.y} width={b.w} height={b.h}
              rx={3}
              fill={fill}
              stroke={stroke}
              strokeWidth={active ? 1.4 : 0.8}
              strokeDasharray={actor === 'bus' ? '4 3' : undefined}
            />
            <text
              x={b.x + 6} y={b.y + 12}
              fontSize={7.5}
              fontFamily="monospace"
              fill={active ? '#e2e8f0' : '#64748b'}
            >
              {b.label}
            </text>
          </g>
        )
      })}

      {/* Cache contents */}
      {step.keys.map((key, i) => {
        const entry = step.cache[key]
        const b = BOX.cache
        const y = b.y + 22 + i * 12
        const stale = entry !== null && entry.value !== step.db[key]
        return (
          <text
            key={`c-${key}`}
            x={b.x + 8} y={y}
            fontSize={7}
            fontFamily="monospace"
            fill={entry === null ? '#475569' : stale ? '#fb7185' : entry.dirty ? '#fbbf24' : '#34d399'}
          >
            {key} = {entry === null ? '<miss>' : `"${entry.value}"`}
            {entry?.dirty ? '  ·dirty' : ''}
            {stale ? '  ·STALE' : ''}
          </text>
        )
      })}

      {/* Database contents */}
      {step.keys.map((key, i) => {
        const b = BOX.db
        const y = b.y + 22 + i * 12
        return (
          <text
            key={`d-${key}`}
            x={b.x + 8} y={y}
            fontSize={7}
            fontFamily="monospace"
            fill="#94a3b8"
          >
            {key} = "{step.db[key]}"
          </text>
        )
      })}

      {/* Events riding the bus */}
      {bus.map((e, i) => {
        const b = BOX.bus
        return (
          <g key={`bus-${e.key}-${i}`}>
            <rect
              x={b.x + 110 + i * 80} y={b.y + 6}
              width={74} height={14} rx={2}
              fill="#2e1065" stroke="#a78bfa" strokeWidth={0.8}
            />
            <text
              x={b.x + 147 + i * 80} y={b.y + 16}
              textAnchor="middle"
              fontSize={6.5}
              fontFamily="monospace"
              fill="#c4b5fd"
            >
              invalidate {e.key}
            </text>
          </g>
        )
      })}

      {/* Op label */}
      {op && (
        <text
          x={152} y={254}
          textAnchor="middle"
          fontSize={7}
          fontFamily="monospace"
          fill={OP_COLORS[op.kind] ?? '#94a3b8'}
        >
          {op.from} → {op.to} · {op.label}
        </text>
      )}
    </svg>
  )
}

// ── Stale window meter ───────────────────────────────────────────────────────

function StaleWindow({ step }: { step: CacheInvalidationStep }) {
  const open = step.staleTicks > 0
  const width = Math.min(100, (step.staleTicks / 8) * 100)

  return (
    <div
      className={`rounded border p-3 ${
        open ? 'border-rose-800 bg-rose-950/20' : 'border-emerald-900/60 bg-emerald-950/10'
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">stale window</p>
      <p className={`font-mono text-lg ${open ? 'text-rose-300' : 'text-emerald-300'}`}>
        {open ? `${step.staleTicks} tick${step.staleTicks === 1 ? '' : 's'} open` : 'closed'}
      </p>
      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full transition-all duration-200 ${open ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: open ? `${width}%` : '0%' }}
        />
      </div>
      <p className="mt-2 font-mono text-[10px] text-slate-500">
        worst window so far: {step.worstWindow} ticks · clock t={step.tick}
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
        {open
          ? 'The cache and the database disagree. Every read served right now is a wrong answer delivered fast.'
          : 'Cache and database agree. A hit is also correct.'}
      </p>
    </div>
  )
}

// ── Strategy comparison ──────────────────────────────────────────────────────

const STRATEGY_ROWS = [
  {
    id: 'write-through' as const,
    write: 'cache + db, synchronous',
    window: 'none',
    cost: 'every write pays db latency',
  },
  {
    id: 'write-back' as const,
    write: 'cache now, db on flush',
    window: 'until flush',
    cost: 'fast writes, guaranteed lag',
  },
  {
    id: 'pub-sub' as const,
    write: 'db + publish invalidate',
    window: 'one hop',
    cost: 'one extra read after a change',
  },
]

function StrategyTable({ step }: { step: CacheInvalidationStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">strategies</p>
      <div className="space-y-1.5">
        {STRATEGY_ROWS.map(row => {
          const isCurrent = step.strategy === row.id
          return (
            <div
              key={row.id}
              className={`rounded border px-2 py-1.5 font-mono text-[11px] ${
                isCurrent
                  ? 'border-emerald-700 bg-emerald-500/5 text-emerald-300'
                  : 'border-slate-800 text-slate-500'
              }`}
            >
              <p className="font-bold">{row.id}</p>
              <p className="text-[10px] text-slate-500">write: {row.write}</p>
              <p className="text-[10px] text-slate-500">
                stale window: <span className={isCurrent ? 'text-emerald-400' : ''}>{row.window}</span>
              </p>
              <p className="text-[10px] text-slate-600">{row.cost}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Op log ───────────────────────────────────────────────────────────────────

const LOG_COLORS = {
  ok: 'text-emerald-400',
  stale: 'text-rose-400',
  event: 'text-violet-300',
  note: 'text-slate-500',
}

function OpLog({ step }: { step: CacheInvalidationStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">op log</p>
      <div className="space-y-0.5">
        {step.log.map((line, i) => (
          <p key={`${i}-${line.text}`} className={`font-mono text-[10px] ${LOG_COLORS[line.kind]}`}>
            {line.text}
          </p>
        ))}
        {step.log.length === 0 && <p className="font-mono text-[10px] text-slate-700">empty</p>}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

function CacheInvalidationView({ step }: { step: CacheInvalidationStep }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-sky-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-sky-400">
          {strategyTitle(step.strategy)}
        </span>
        {step.servedIsStale && (
          <span className="font-mono text-[10px] text-rose-400">
            reader would receive a stale value
          </span>
        )}
        {step.bus.length > 0 && (
          <span className="font-mono text-[10px] text-violet-300">
            {step.bus.length} invalidation event in flight
          </span>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1fr)_minmax(240px,0.6fr)]">
        <div className="flex justify-center rounded border border-slate-800 bg-slate-950/30 p-4">
          <TopologyView step={step} />
        </div>

        <div className="min-w-0 space-y-3">
          <StaleWindow step={step} />
          <OpLog step={step} />
        </div>

        <div className="space-y-3">
          <StrategyTable step={step} />
          <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">
              why pub/sub
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Polling asks &quot;did anything change?&quot; on a schedule that has nothing to do with when
              things change. Pub/sub inverts it: the writer already knows, so the writer tells you.
              No polling. No guessing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CacheInvalidation() {
  const steps = useMemo(() => collectSteps(cacheInvalidationSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <CacheInvalidationView step={player.currentStep} />
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
      />
    </div>
  )
}
