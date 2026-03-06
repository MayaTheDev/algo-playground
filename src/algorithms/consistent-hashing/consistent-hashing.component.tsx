import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { consistentHashSteps, type ConsistentHashStep } from './consistent-hashing.logic'

const LEGEND = [
  { color: 'bg-emerald-400', label: 'server' },
  { color: 'bg-slate-400', label: 'data item' },
  { color: 'bg-amber-400', label: 'moved key' },
]

// ── Geometry helpers ──────────────────────────────────────────────────────────

const CX = 160  // SVG circle center x
const CY = 160  // SVG circle center y
const R  = 120  // ring radius
const DOT_SERVER = 10
const DOT_DATA   = 6

function ringPoint(deg: number, radius: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)]
}

// Draw a short clockwise arc from src to dst (for assignment arrows)
function arcPath(srcDeg: number, dstDeg: number): string {
  const [x1, y1] = ringPoint(srcDeg, R - 18)
  const [x2, y2] = ringPoint(dstDeg, R - 18)
  const diff = ((dstDeg - srcDeg) + 360) % 360
  const large = diff > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${R - 18} ${R - 18} 0 ${large} 1 ${x2} ${y2}`
}

// ── Ring SVG ─────────────────────────────────────────────────────────────────

function HashRing({ step }: { step: ConsistentHashStep }) {
  const svgSize = 320

  return (
    <svg
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      width={svgSize}
      height={svgSize}
      className="shrink-0"
    >
      {/* Outer ring */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth={2} />

      {/* Tick marks every 30° */}
      {Array.from({ length: 12 }, (_, i) => {
        const deg = i * 30
        const [x1, y1] = ringPoint(deg, R - 5)
        const [x2, y2] = ringPoint(deg, R + 5)
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={1} />
        )
      })}

      {/* Assignment arcs: data → server */}
      {step.dataItems
        .filter(item => item.assignedTo !== null)
        .map(item => {
          const server = step.servers.find(s => s.id === item.assignedTo)
          if (!server) return null
          const isMoved = step.movedItems.includes(item.key)
          const isActive = step.activeItem === item.key
          return (
            <path
              key={`arc-${item.key}`}
              d={arcPath(item.position, server.position)}
              fill="none"
              stroke={isMoved ? '#f59e0b' : isActive ? '#34d399' : '#334155'}
              strokeWidth={isMoved || isActive ? 1.5 : 1}
              strokeDasharray={isMoved || isActive ? '4 2' : '3 3'}
              opacity={0.7}
            />
          )
        })}

      {/* Data item dots */}
      {step.dataItems.map(item => {
        const [x, y] = ringPoint(item.position, R)
        const isMoved = step.movedItems.includes(item.key)
        const isActive = step.activeItem === item.key
        const fill = isMoved ? '#f59e0b' : isActive ? '#34d399' : '#64748b'
        return (
          <g key={`data-${item.key}`}>
            <circle cx={x} cy={y} r={DOT_DATA} fill={fill} opacity={0.9} />
            <text
              x={ringPoint(item.position, R + 18)[0]}
              y={ringPoint(item.position, R + 18)[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={7}
              fill={isMoved ? '#fbbf24' : isActive ? '#6ee7b7' : '#475569'}
              fontFamily="monospace"
            >
              {item.key.split(':')[0]}
            </text>
          </g>
        )
      })}

      {/* Server dots */}
      {step.servers.map(server => {
        const [x, y] = ringPoint(server.position, R)
        const isActive = step.activeItem === server.id
        return (
          <g key={`srv-${server.id}`}>
            <circle
              cx={x}
              cy={y}
              r={DOT_SERVER}
              fill={server.color}
              opacity={isActive ? 1 : 0.85}
              stroke={isActive ? '#fff' : 'transparent'}
              strokeWidth={1.5}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={7}
              fontWeight="bold"
              fill="#020617"
              fontFamily="monospace"
            >
              {server.id}
            </text>
          </g>
        )
      })}

      {/* Center label */}
      <text
        x={CX}
        y={CY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9}
        fill="#334155"
        fontFamily="monospace"
      >
        360°
      </text>
    </svg>
  )
}

// ── Assignment table ──────────────────────────────────────────────────────────

function AssignmentTable({ step }: { step: ConsistentHashStep }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3 min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">key → server</p>
      <div className="space-y-1.5">
        {step.dataItems.map(item => {
          const server = step.servers.find(s => s.id === item.assignedTo)
          const isMoved = step.movedItems.includes(item.key)
          const isActive = step.activeItem === item.key
          return (
            <div
              key={item.key}
              className={`flex items-center justify-between gap-3 px-2 py-1 rounded font-mono text-xs ${
                isMoved
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  : isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'text-slate-400'
              }`}
            >
              <span className="truncate">{item.key}</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="text-slate-600">@{item.position}°</span>
                <span className="text-slate-600">→</span>
                {server ? (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: server.color + '22', color: server.color }}
                  >
                    {server.id}
                  </span>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </span>
            </div>
          )
        })}
        {step.dataItems.length === 0 && (
          <p className="text-xs text-slate-600 font-mono">no keys placed yet</p>
        )}
      </div>
    </div>
  )
}

// ── Server list ───────────────────────────────────────────────────────────────

function ServerList({ step }: { step: ConsistentHashStep }) {
  const keyCountByServer: Record<string, number> = {}
  for (const item of step.dataItems) {
    if (item.assignedTo) {
      keyCountByServer[item.assignedTo] = (keyCountByServer[item.assignedTo] ?? 0) + 1
    }
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">servers on ring</p>
      <div className="space-y-1.5">
        {step.servers.map(server => (
          <div
            key={server.id}
            className={`flex items-center justify-between px-2 py-1 rounded font-mono text-xs ${
              step.activeItem === server.id
                ? 'bg-slate-700/60 border border-slate-600'
                : 'text-slate-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: server.color }}
              />
              <span style={{ color: server.color }}>{server.id}</span>
            </span>
            <span className="text-slate-500">{server.position}°</span>
            <span className="text-slate-600">
              {keyCountByServer[server.id] ?? 0} keys
            </span>
          </div>
        ))}
        {step.servers.length === 0 && (
          <p className="text-xs text-slate-600 font-mono">empty</p>
        )}
      </div>
    </div>
  )
}

// ── Phase badge ───────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<ConsistentHashStep['phase'], string> = {
  'place-servers': 'placing servers',
  'place-data':   'placing data',
  'add-server':   'adding server',
  'remove-server':'removing server',
}

const PHASE_COLORS: Record<ConsistentHashStep['phase'], string> = {
  'place-servers': 'text-sky-400 border-sky-800',
  'place-data':    'text-slate-400 border-slate-700',
  'add-server':    'text-emerald-400 border-emerald-800',
  'remove-server': 'text-amber-400 border-amber-800',
}

// ── Main component ────────────────────────────────────────────────────────────

function ConsistentHashingView({ step }: { step: ConsistentHashStep }) {
  return (
    <div className="w-full max-w-4xl space-y-4">
      {/* Phase badge */}
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] uppercase tracking-widest border px-2 py-0.5 font-mono ${PHASE_COLORS[step.phase]}`}
        >
          {PHASE_LABELS[step.phase]}
        </span>
        {step.movedItems.length > 0 && (
          <span className="text-[10px] text-amber-400 font-mono">
            {step.movedItems.length} key{step.movedItems.length !== 1 ? 's' : ''} moved
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Ring */}
        <div className="shrink-0 flex justify-center">
          <HashRing step={step} />
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0 space-y-3">
          <AssignmentTable step={step} />
          <ServerList step={step} />
        </div>
      </div>
    </div>
  )
}

export function ConsistentHashing() {
  const steps = useMemo(() => collectSteps(consistentHashSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <ConsistentHashingView step={player.currentStep} />
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
      />
    </div>
  )
}
