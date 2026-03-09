import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'
import { vectorClockSteps, type VectorClockStep } from './vector-clock.logic'

const NODE_COLORS: Record<string, { dot: string; text: string; border: string; bg: string }> = {
  A: {
    dot: 'bg-sky-400',
    text: 'text-sky-300',
    border: 'border-sky-500',
    bg: 'bg-sky-500/10',
  },
  B: {
    dot: 'bg-violet-400',
    text: 'text-violet-300',
    border: 'border-violet-500',
    bg: 'bg-violet-500/10',
  },
  C: {
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    border: 'border-amber-500',
    bg: 'bg-amber-500/10',
  },
}

const EVENT_TYPE_STYLE: Record<string, string> = {
  local: 'ring-2 ring-slate-500',
  send: 'ring-2 ring-emerald-400',
  receive: 'ring-2 ring-emerald-400',
}

const NODE_IDS = ['A', 'B', 'C']

// Layout constants
const TIMELINE_HEIGHT = 90     // px per node row
const DOT_RADIUS = 10          // px
const LEFT_LABEL = 52          // px for node label column
const RIGHT_CLOCK = 140        // px for clock column on right
const ARROW_HEAD = 7           // arrowhead size

function VectorClockView({ step }: { step: VectorClockStep }) {
  // SVG dimensions — computed from event count
  const eventsPerRow = 10
  const totalEvents = Math.max(step.events.length, 1)

  // Assign each event a horizontal position (slot) and row (node)
  // Track per-node event indices for slot assignment
  const nodeEventSlots: Record<string, number[]> = { A: [], B: [], C: [] }
  const eventPositions: { x: number; y: number; nodeId: string; eventIdx: number }[] = []

  // We lay out all events left-to-right in the order they were emitted,
  // but place them on their node's horizontal row.
  // x position = event's global index mapped to a column slot.
  const slotWidth = 56  // px between event dots horizontally
  const startX = LEFT_LABEL + 24
  const svgWidth = startX + totalEvents * slotWidth + RIGHT_CLOCK + 16

  step.events.forEach((ev, globalIdx) => {
    nodeEventSlots[ev.node].push(globalIdx)
    const rowIdx = NODE_IDS.indexOf(ev.node)
    const x = startX + globalIdx * slotWidth
    const y = rowIdx * TIMELINE_HEIGHT + TIMELINE_HEIGHT / 2
    eventPositions.push({ x, y, nodeId: ev.node, eventIdx: globalIdx })
  })

  // Arrow paths: from send event position to receive event position
  const arrowPaths = step.arrows.map(arrow => {
    const fromPos = eventPositions[arrow.fromTime]
    const toPos = eventPositions[arrow.toTime]
    if (!fromPos || !toPos) return null
    return { from: fromPos, to: toPos, arrowData: arrow }
  }).filter(Boolean) as { from: typeof eventPositions[0]; to: typeof eventPositions[0]; arrowData: typeof step.arrows[0] }[]

  // Timeline end x (after last event)
  const timelineEndX = totalEvents > 0
    ? startX + (totalEvents - 1) * slotWidth + DOT_RADIUS + 12
    : startX + 40

  const svgHeight = NODE_IDS.length * TIMELINE_HEIGHT + 16
  const currentEvent = step.events[step.currentEvent]
  const activeClock = currentEvent ? step.nodes.find((node) => node.id === currentEvent.node)?.clock : null

  return (
    <div className="w-full space-y-4">
      {/* Main SVG canvas */}
      <div className="rounded border border-slate-800 bg-slate-950/60 overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="block min-w-full"
          style={{ fontFamily: 'ui-monospace, monospace' }}
        >
          {/* Arrow defs */}
          <defs>
            <marker id="arrowhead" markerWidth={ARROW_HEAD} markerHeight={ARROW_HEAD} refX={ARROW_HEAD - 1} refY={ARROW_HEAD / 2} orient="auto">
              <polygon
                points={`0 0, ${ARROW_HEAD} ${ARROW_HEAD / 2}, 0 ${ARROW_HEAD}`}
                fill="#34d399"
                opacity="0.8"
              />
            </marker>
          </defs>

          {/* Node rows */}
          {NODE_IDS.map((nodeId, rowIdx) => {
            const y = rowIdx * TIMELINE_HEIGHT + TIMELINE_HEIGHT / 2
            const colors = NODE_COLORS[nodeId]

            return (
              <g key={nodeId}>
                {/* Node label */}
                <text
                  x={LEFT_LABEL - 8}
                  y={y + 5}
                  textAnchor="end"
                  fontSize={14}
                  fontWeight="600"
                  className={colors.text}
                  fill="currentColor"
                  style={{ fill: nodeId === 'A' ? '#7dd3fc' : nodeId === 'B' ? '#c4b5fd' : '#fcd34d' }}
                >
                  Node {nodeId}
                </text>

                {/* Timeline line */}
                <line
                  x1={LEFT_LABEL}
                  y1={y}
                  x2={timelineEndX}
                  y2={y}
                  stroke={nodeId === 'A' ? '#0ea5e9' : nodeId === 'B' ? '#8b5cf6' : '#f59e0b'}
                  strokeOpacity="0.3"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />

                {/* Arrow cap at end of timeline */}
                <polygon
                  points={`${timelineEndX},${y - 4} ${timelineEndX + 8},${y} ${timelineEndX},${y + 4}`}
                  fill={nodeId === 'A' ? '#0ea5e9' : nodeId === 'B' ? '#8b5cf6' : '#f59e0b'}
                  opacity="0.3"
                />

                {/* Time label */}
                <text
                  x={timelineEndX + 14}
                  y={y + 5}
                  fontSize={10}
                  fill="#475569"
                >
                  time →
                </text>
              </g>
            )
          })}

          {/* Message arrows (drawn below dots so dots sit on top) */}
          {arrowPaths.map((path, i) => {
            const { from, to } = path
            const dx = to.x - from.x
            const dy = to.y - from.y
            const len = Math.sqrt(dx * dx + dy * dy)
            // shorten arrow by DOT_RADIUS at both ends
            const ux = dx / len
            const uy = dy / len
            const x1 = from.x + ux * (DOT_RADIUS + 2)
            const y1 = from.y + uy * (DOT_RADIUS + 2)
            const x2 = to.x - ux * (DOT_RADIUS + 4)
            const y2 = to.y - uy * (DOT_RADIUS + 4)

            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  markerEnd="url(#arrowhead)"
                  strokeDasharray="5 2"
                />
              </g>
            )
          })}

          {/* Event dots */}
          {eventPositions.map((pos, globalIdx) => {
            const ev = step.events[globalIdx]
            const isActive = step.currentEvent === globalIdx
            const colors = NODE_COLORS[ev.node]
            const typeStyle = EVENT_TYPE_STYLE[ev.type]
            const isSendOrReceive = ev.type === 'send' || ev.type === 'receive'

            return (
              <g key={globalIdx} transform={`translate(${pos.x}, ${pos.y})`}>
                {/* Glow for active event */}
                {isActive && (
                  <circle r={DOT_RADIUS + 6} fill="#10b981" opacity="0.15" />
                )}

                {/* Outer ring for send/receive */}
                {isSendOrReceive && (
                  <circle
                    r={DOT_RADIUS + 4}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth={1.5}
                    opacity={isActive ? 1 : 0.35}
                  />
                )}

                {/* Main dot */}
                <circle
                  r={DOT_RADIUS}
                  fill={
                    isActive
                      ? '#10b981'
                      : ev.node === 'A'
                      ? '#0369a1'
                      : ev.node === 'B'
                      ? '#5b21b6'
                      : '#92400e'
                  }
                  stroke={
                    isActive
                      ? '#34d399'
                      : ev.node === 'A'
                      ? '#0ea5e9'
                      : ev.node === 'B'
                      ? '#8b5cf6'
                      : '#f59e0b'
                  }
                  strokeWidth={isActive ? 2 : 1.5}
                  opacity={isActive ? 1 : 0.75}
                />

                {/* Event label below dot */}
                <text
                  y={DOT_RADIUS + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill={isActive ? '#34d399' : '#64748b'}
                  fontWeight={isActive ? '700' : '400'}
                >
                  {ev.label}
                </text>

                {/* Type badge above dot for send/receive */}
                {isSendOrReceive && (
                  <text
                    y={-(DOT_RADIUS + 6)}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#34d399"
                    opacity={isActive ? 0.9 : 0.4}
                  >
                    {ev.type === 'send' ? `→${ev.partner}` : `←${ev.partner}`}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
        {/* Node vector clock panels */}
        <div className="grid gap-3 md:grid-cols-3">
          {step.nodes.map(node => {
            const colors = NODE_COLORS[node.id]
            // Is this node involved in the current event?
            const isActiveNode = currentEvent?.node === node.id
            const clockStr = `[${node.clock.join(', ')}]`

            return (
              <div
                key={node.id}
                className={`rounded border p-3 transition-all ${
                  isActiveNode
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : `border-slate-800 bg-slate-950/40`
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${colors.dot}`}
                  />
                  <span className={`text-xs font-semibold ${isActiveNode ? 'text-emerald-300' : colors.text}`}>
                    Node {node.id}
                  </span>
                </div>

                <div className={`font-mono text-base ${isActiveNode ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {clockStr}
                </div>

                <div className="mt-2 flex gap-1">
                  {node.clock.map((count, k) => (
                    <div key={k} className="flex-1 text-center">
                      <div className="text-[8px] text-slate-600 uppercase">
                        {NODE_IDS[k]}
                      </div>
                      <div
                        className={`rounded text-xs font-mono py-0.5 ${
                          isActiveNode && k === ['A', 'B', 'C'].indexOf(node.id)
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-600">causality check</p>
          <p className="font-mono text-sm text-slate-300">
            {currentEvent
              ? `${currentEvent.label}: ${currentEvent.type === 'receive' ? 'merge sender clock, then increment local slot' : currentEvent.type === 'send' ? 'increment local slot, then attach the vector' : 'increment only the local slot'}`
              : 'Compare two event vectors: if neither dominates, the events are concurrent.'}
          </p>
          <div className="mt-3 border-t border-slate-800 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-600">active vector</p>
            <p className="mt-1 font-mono text-lg text-emerald-300">
              {activeClock ? `[${activeClock.join(', ')}]` : 'none'}
            </p>
          </div>
        </div>
      </div>

      {/* Causality legend */}
      <div className="rounded border border-slate-800 bg-slate-950/40 px-4 py-2.5 flex flex-wrap gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm bg-emerald-400/60" />
          active event
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 border border-emerald-400 rounded-sm opacity-60" />
          send / receive
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="font-mono text-[10px]">VC(e₁) ≤ VC(e₂)</span>
          →
          <span className="text-slate-500">e₁ happened-before e₂</span>
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="font-mono text-[10px]">neither ≤ other</span>
          →
          <span className="text-slate-500">concurrent (∥)</span>
        </span>
      </div>
    </div>
  )
}

const LEGEND = [
  { color: 'bg-emerald-400', label: 'active event' },
  { color: 'bg-sky-400', label: 'node A' },
  { color: 'bg-violet-400', label: 'node B' },
  { color: 'bg-amber-400', label: 'node C' },
]

export function VectorClock() {
  const steps = useMemo(() => collectSteps(vectorClockSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <VectorClockView step={player.currentStep} />
      </div>
      <Controls
        player={player}
        stepDescription={player.currentStep.description}
        legend={LEGEND}
      />
    </div>
  )
}
