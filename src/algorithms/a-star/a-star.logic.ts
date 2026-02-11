import type { AStarCell, AStarStep } from '../../types/algo.types'

const ROWS = 8
const COLS = 12

const WALLS: [number, number][] = [
  [1, 2], [2, 2], [3, 2], [4, 2],
  [2, 5], [3, 5], [4, 5],
  [5, 7], [5, 8], [5, 9],
  [6, 4], [7, 4],
]

const START: [number, number] = [0, 0]
const END: [number, number] = [7, 11]

function makeGrid(): AStarCell[][] {
  const wallSet = new Set(WALLS.map(([r, c]) => `${r},${c}`))
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      row: r,
      col: c,
      state: wallSet.has(`${r},${c}`)
        ? 'wall'
        : r === START[0] && c === START[1]
          ? 'start'
          : r === END[0] && c === END[1]
            ? 'end'
            : 'empty',
      g: Infinity,
      f: Infinity,
    } satisfies AStarCell)),
  )
}

function cloneGrid(grid: AStarCell[][]): AStarCell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })))
}

function heuristic(r: number, c: number): number {
  return Math.abs(r - END[0]) + Math.abs(c - END[1])
}

export function* aStarSteps(): Generator<AStarStep> {
  const grid = makeGrid()
  grid[START[0]][START[1]].g = 0
  grid[START[0]][START[1]].f = heuristic(START[0], START[1])

  const openSet = new Set<string>([`${START[0]},${START[1]}`])
  const cameFrom = new Map<string, string>()

  yield {
    grid: cloneGrid(grid),
    description: `Initialize. Start=(0,0), End=(7,11). g[start]=0, f=h=${heuristic(START[0], START[1])}.`,
  }

  const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]

  while (openSet.size > 0) {
    // Pick node with lowest f in open set
    let bestKey = ''
    let bestF = Infinity
    for (const key of openSet) {
      const [r, c] = key.split(',').map(Number)
      if (grid[r][c].f < bestF) {
        bestF = grid[r][c].f
        bestKey = key
      }
    }

    const [cr, cc] = bestKey.split(',').map(Number)

    if (cr === END[0] && cc === END[1]) {
      // Reconstruct path
      const path: string[] = []
      let cur = bestKey
      while (cur) {
        path.push(cur)
        cur = cameFrom.get(cur) ?? ''
      }
      for (const key of path) {
        const [r, c] = key.split(',').map(Number)
        if (grid[r][c].state !== 'start' && grid[r][c].state !== 'end') {
          grid[r][c].state = 'path'
        }
      }
      yield {
        grid: cloneGrid(grid),
        description: `Path found! Length: ${path.length} cells.`,
      }
      return
    }

    openSet.delete(bestKey)
    if (grid[cr][cc].state !== 'start') grid[cr][cc].state = 'closed'

    yield {
      grid: cloneGrid(grid),
      description: `Close (${cr},${cc}): g=${grid[cr][cc].g}, f=${grid[cr][cc].f}.`,
    }

    for (const [dr, dc] of DIRS) {
      const nr = cr + dr
      const nc = cc + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      const neighbor = grid[nr][nc]
      if (neighbor.state === 'wall' || neighbor.state === 'closed') continue

      const tentativeG = grid[cr][cc].g + 1
      if (tentativeG < neighbor.g) {
        cameFrom.set(`${nr},${nc}`, bestKey)
        neighbor.g = tentativeG
        neighbor.f = tentativeG + heuristic(nr, nc)
        if (neighbor.state !== 'end') neighbor.state = 'open'
        openSet.add(`${nr},${nc}`)

        yield {
          grid: cloneGrid(grid),
          description: `Open (${nr},${nc}): g=${tentativeG}, h=${heuristic(nr, nc)}, f=${neighbor.f}.`,
        }
      }
    }
  }

  yield {
    grid: cloneGrid(grid),
    description: 'No path found.',
  }
}
