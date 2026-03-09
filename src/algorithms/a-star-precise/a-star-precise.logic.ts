/**
 * A* with precise costs — Day 58.
 *
 * Day 27's A* collapsed everything into a single f score. That hid the only
 * distinction that matters when a search misbehaves:
 *
 *   g = what this path has already cost. A fact. Measured.
 *   h = what the rest is guessed to cost. A guess. Never measured.
 *
 * Keeping them apart makes the trade-off visible: shrink the guess and the
 * search wanders; inflate the guess and the search stops finding the shortest
 * path at all.
 */

export type HeuristicMode = 'zero' | 'manhattan' | 'inflated'

export type PreciseCellState =
  | 'empty'
  | 'wall'
  | 'start'
  | 'end'
  | 'open'
  | 'closed'
  | 'path'

export type PreciseCell = {
  row: number
  col: number
  state: PreciseCellState
  /** cost actually spent getting here — Infinity until the cell is reached */
  g: number
  /** heuristic estimate of the cost still remaining */
  h: number
  /** g + h */
  f: number
  /** true once the cell has been popped off the frontier */
  settled: boolean
}

export type FrontierEntry = {
  row: number
  col: number
  g: number
  h: number
  f: number
}

export type RelaxKind = 'discovered' | 'improved' | 'rejected' | 'reopened'

export type RelaxOutcome = {
  row: number
  col: number
  g: number
  h: number
  f: number
  kind: RelaxKind
  note: string
}

export type AStarPreciseStep = {
  mode: HeuristicMode
  grid: PreciseCell[][]
  /** cell popped from the frontier this step */
  current: [number, number] | null
  /** open set, sorted by f, then h (the tie-break that matters) */
  frontier: FrontierEntry[]
  /** what happened to each neighbour of `current` */
  relaxed: RelaxOutcome[]
  /** cells popped so far — the honest measure of "work done" */
  expanded: number
  /** cost of the returned path, once found */
  pathCost: number | null
  /** true shortest-path cost, computed by BFS up front */
  optimalCost: number
  phase: 'init' | 'expand' | 'goal' | 'verdict'
  description: string
}

// ─── Mode metadata ───────────────────────────────────────────────────────────

export type ModeMeta = {
  id: HeuristicMode
  label: string
  formula: string
  /** one-line claim the visualiser is about to prove or break */
  claim: string
  admissible: boolean
}

export const MODES: ModeMeta[] = [
  {
    id: 'zero',
    label: 'underestimate',
    formula: 'h = 0',
    claim: 'Never guesses. Degenerates into Dijkstra and searches in every direction.',
    admissible: true,
  },
  {
    id: 'manhattan',
    label: 'admissible',
    formula: 'h = |Δrow| + |Δcol|',
    claim: 'Never overshoots the true remaining cost. Shortest path guaranteed.',
    admissible: true,
  },
  {
    id: 'inflated',
    label: 'overestimate',
    formula: 'h = 3 × (|Δrow| + |Δcol|)',
    claim: 'Guesses high, so g stops mattering. Fast, and wrong.',
    admissible: false,
  },
]

export function modeMeta(mode: HeuristicMode): ModeMeta {
  return MODES.find(m => m.id === mode) ?? MODES[1]
}

// ─── The map ─────────────────────────────────────────────────────────────────
//
// Two ways from start to goal:
//
//   the serpentine (top)  — always drifting toward the goal, so h keeps
//                           dropping, but it costs 32 steps.
//   the open room (below) — starts by moving *away* from the goal, so h goes
//                           up before it comes down, and it costs 22.
//
// An honest h picks the room. An inflated h can't see past the first few
// steps of moving away, so it commits to the serpentine.

const ROWS = 7
const COLS = 15
const START: [number, number] = [0, 0]
const END: [number, number] = [0, 14]

function buildOpenCells(): Set<string> {
  const open = new Set<string>()
  const add = (r: number, c: number) => open.add(`${r},${c}`)

  // Serpentine corridor, rows 0–3
  for (const c of [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14]) add(0, c)
  for (const c of [2, 3, 4, 6, 7, 8, 10, 11, 12]) add(3, c)
  for (const c of [2, 4, 6, 8, 10, 12]) {
    for (let r = 0; r <= 3; r++) add(r, c)
  }

  // The two shafts that drop into the room
  for (let r = 0; r <= 4; r++) {
    add(r, 0)
    add(r, 14)
  }

  // The open room, rows 4–6
  for (let r = 4; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) add(r, c)
  }

  return open
}

const OPEN_CELLS = buildOpenCells()

function isWall(r: number, c: number): boolean {
  return !OPEN_CELLS.has(`${r},${c}`)
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS
}

const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]

// ─── Heuristics ──────────────────────────────────────────────────────────────

/** Manhattan distance — the true remaining cost on an obstacle-free grid. */
export function manhattan(r: number, c: number): number {
  return Math.abs(r - END[0]) + Math.abs(c - END[1])
}

const INFLATION = 3

export function heuristicFor(mode: HeuristicMode, r: number, c: number): number {
  switch (mode) {
    case 'zero':
      return 0
    case 'inflated':
      return manhattan(r, c) * INFLATION
    default:
      return manhattan(r, c)
  }
}

// ─── True shortest path, measured once, by BFS ───────────────────────────────
//
// The visualiser needs a ground truth to grade the search against. It cannot
// be the search's own answer — that is the thing under test.

function bfsOptimalCost(): number {
  const dist = new Map<string, number>([[`${START[0]},${START[1]}`, 0]])
  const queue: [number, number][] = [START]
  while (queue.length > 0) {
    const [r, c] = queue.shift()!
    const d = dist.get(`${r},${c}`)!
    if (r === END[0] && c === END[1]) return d
    for (const [dr, dc] of DIRS) {
      const nr = r + dr
      const nc = c + dc
      if (!inBounds(nr, nc) || isWall(nr, nc)) continue
      const key = `${nr},${nc}`
      if (dist.has(key)) continue
      dist.set(key, d + 1)
      queue.push([nr, nc])
    }
  }
  return Infinity
}

export const OPTIMAL_COST = bfsOptimalCost()

// ─── Grid helpers ────────────────────────────────────────────────────────────

function makeGrid(mode: HeuristicMode): PreciseCell[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const wall = isWall(r, c)
      const state: PreciseCellState = wall
        ? 'wall'
        : r === START[0] && c === START[1]
          ? 'start'
          : r === END[0] && c === END[1]
            ? 'end'
            : 'empty'
      return {
        row: r,
        col: c,
        state,
        g: Infinity,
        h: heuristicFor(mode, r, c),
        f: Infinity,
        settled: false,
      } satisfies PreciseCell
    }),
  )
}

function cloneGrid(grid: PreciseCell[][]): PreciseCell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })))
}

function keyOf(r: number, c: number): string {
  return `${r},${c}`
}

function parseKey(key: string): [number, number] {
  const [r, c] = key.split(',').map(Number)
  return [r, c]
}

// ─── Step generator ──────────────────────────────────────────────────────────

export function* aStarPreciseSteps(mode: HeuristicMode): Generator<AStarPreciseStep> {
  const meta = modeMeta(mode)
  const grid = makeGrid(mode)
  const cameFrom = new Map<string, string>()
  const openSet = new Set<string>()

  const start = grid[START[0]][START[1]]
  start.g = 0
  start.f = start.g + start.h
  openSet.add(keyOf(START[0], START[1]))

  let expanded = 0

  function frontierSnapshot(): FrontierEntry[] {
    return [...openSet]
      .map(key => {
        const [r, c] = parseKey(key)
        const cell = grid[r][c]
        return { row: r, col: c, g: cell.g, h: cell.h, f: cell.f }
      })
      .sort((a, b) => (a.f === b.f ? a.h - b.h : a.f - b.f))
  }

  yield {
    mode,
    grid: cloneGrid(grid),
    current: null,
    frontier: frontierSnapshot(),
    relaxed: [],
    expanded: 0,
    pathCost: null,
    optimalCost: OPTIMAL_COST,
    phase: 'init',
    description:
      `${meta.formula}. Start (${START[0]},${START[1]}) has g=0 — nothing spent yet — and h=${start.h}, ` +
      `a guess about the ${OPTIMAL_COST} steps that actually remain.`,
  }

  while (openSet.size > 0) {
    // Pop the lowest f. Ties broken by the smaller h — prefer the node we
    // believe is closer to the goal over one that just looks cheap so far.
    let bestKey = ''
    let bestF = Infinity
    let bestH = Infinity
    for (const key of openSet) {
      const [r, c] = parseKey(key)
      const cell = grid[r][c]
      if (cell.f < bestF || (cell.f === bestF && cell.h < bestH)) {
        bestF = cell.f
        bestH = cell.h
        bestKey = key
      }
    }

    const [cr, cc] = parseKey(bestKey)
    const currentCell = grid[cr][cc]
    openSet.delete(bestKey)
    currentCell.settled = true

    // ── Goal popped: the search commits to whatever path it holds ──────────
    if (cr === END[0] && cc === END[1]) {
      const path: string[] = []
      let cur: string | undefined = bestKey
      while (cur) {
        path.push(cur)
        cur = cameFrom.get(cur)
      }
      for (const key of path) {
        const [r, c] = parseKey(key)
        if (grid[r][c].state !== 'start' && grid[r][c].state !== 'end') {
          grid[r][c].state = 'path'
        }
      }

      const pathCost = currentCell.g

      yield {
        mode,
        grid: cloneGrid(grid),
        current: [cr, cc],
        frontier: frontierSnapshot(),
        relaxed: [],
        expanded,
        pathCost,
        optimalCost: OPTIMAL_COST,
        phase: 'goal',
        description:
          `Goal popped with g=${pathCost}. g is the only number here that was measured — ` +
          `h is 0 at the goal because there is nothing left to guess about.`,
      }

      const gap = pathCost - OPTIMAL_COST
      yield {
        mode,
        grid: cloneGrid(grid),
        current: null,
        frontier: [],
        relaxed: [],
        expanded,
        pathCost,
        optimalCost: OPTIMAL_COST,
        phase: 'verdict',
        description:
          gap === 0
            ? `${expanded} cells expanded, path cost ${pathCost} — that is the true shortest path. ` +
              `h never claimed more than the remaining cost, so no cheaper route could hide behind a big f.`
            : `${expanded} cells expanded, path cost ${pathCost} — but the shortest route costs ${OPTIMAL_COST}. ` +
              `Overstating h by ${INFLATION}× made the real route look expensive, and the search stopped ` +
              `before it ever priced it. ${gap} steps lost, silently.`,
      }
      return
    }

    if (currentCell.state !== 'start') currentCell.state = 'closed'
    expanded++

    // ── Relax neighbours ───────────────────────────────────────────────────
    const relaxed: RelaxOutcome[] = []

    for (const [dr, dc] of DIRS) {
      const nr = cr + dr
      const nc = cc + dc
      if (!inBounds(nr, nc)) continue
      const neighbor = grid[nr][nc]
      if (neighbor.state === 'wall') continue

      const tentativeG = currentCell.g + 1
      const wasSettled = neighbor.settled

      if (tentativeG < neighbor.g) {
        const kind: RelaxKind = !Number.isFinite(neighbor.g)
          ? 'discovered'
          : wasSettled
            ? 'reopened'
            : 'improved'

        cameFrom.set(keyOf(nr, nc), bestKey)
        neighbor.g = tentativeG
        neighbor.f = tentativeG + neighbor.h
        neighbor.settled = false
        if (neighbor.state !== 'end') neighbor.state = 'open'
        openSet.add(keyOf(nr, nc))

        relaxed.push({
          row: nr,
          col: nc,
          g: neighbor.g,
          h: neighbor.h,
          f: neighbor.f,
          kind,
          note:
            kind === 'discovered'
              ? `first route here — g=${tentativeG}`
              : kind === 'reopened'
                // An inadmissible h can settle a cell too early. A v1 that
                // trusts its closed set never notices; this one re-opens.
                ? `already settled, but a cheaper route appeared — g drops to ${tentativeG}`
                : `cheaper route — g drops to ${tentativeG}`,
        })
      } else {
        relaxed.push({
          row: nr,
          col: nc,
          g: neighbor.g,
          h: neighbor.h,
          f: neighbor.f,
          kind: 'rejected',
          note: `already reachable for g=${neighbor.g}; this route costs ${tentativeG}`,
        })
      }
    }

    const improvements = relaxed.filter(r => r.kind !== 'rejected').length

    yield {
      mode,
      grid: cloneGrid(grid),
      current: [cr, cc],
      frontier: frontierSnapshot(),
      relaxed,
      expanded,
      pathCost: null,
      optimalCost: OPTIMAL_COST,
      phase: 'expand',
      description:
        `Expand (${cr},${cc}): g=${currentCell.g} spent, h=${currentCell.h} guessed, f=${currentCell.f}. ` +
        (improvements === 0
          ? 'No neighbour got cheaper — this expansion bought nothing.'
          : `${improvements} neighbour${improvements === 1 ? '' : 's'} updated.`),
    }
  }

  yield {
    mode,
    grid: cloneGrid(grid),
    current: null,
    frontier: [],
    relaxed: [],
    expanded,
    pathCost: null,
    optimalCost: OPTIMAL_COST,
    phase: 'verdict',
    description: `Frontier empty after ${expanded} expansions and the goal was never reached.`,
  }
}

// ─── Summary, for the side-by-side trade-off table ───────────────────────────

export type ModeSummary = {
  mode: HeuristicMode
  expanded: number
  pathCost: number | null
  optimal: boolean
}

export function summarizeMode(mode: HeuristicMode): ModeSummary {
  let last: AStarPreciseStep | null = null
  for (const step of aStarPreciseSteps(mode)) last = step
  const pathCost = last?.pathCost ?? null
  return {
    mode,
    expanded: last?.expanded ?? 0,
    pathCost,
    optimal: pathCost !== null && pathCost === OPTIMAL_COST,
  }
}
