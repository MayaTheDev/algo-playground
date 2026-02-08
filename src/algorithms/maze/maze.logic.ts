import type { MazeStep, MazeCell } from '../../types/algo.types'

export type Grid = MazeCell[][]

const ROWS = 8
const COLS = 10
const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]

/** Generate a random maze using recursive backtracking */
export function generateMaze(): Grid {
  const grid: Grid = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      row: r,
      col: c,
      walls: { top: true, right: true, bottom: true, left: true },
    })),
  )

  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  const stack: [number, number][] = [[0, 0]]
  visited[0][0] = true

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1]
    const neighbors: [number, number, string, string][] = []

    for (const [dr, dc] of DIRS) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc]) {
        const wallFrom = dr === -1 ? 'top' : dr === 1 ? 'bottom' : dc === -1 ? 'left' : 'right'
        const wallTo = dr === -1 ? 'bottom' : dr === 1 ? 'top' : dc === -1 ? 'right' : 'left'
        neighbors.push([nr, nc, wallFrom, wallTo])
      }
    }

    if (neighbors.length === 0) {
      stack.pop()
    } else {
      const [nr, nc, wallFrom, wallTo] = neighbors[Math.floor(Math.random() * neighbors.length)]
      ;(grid[r][c].walls as Record<string, boolean>)[wallFrom] = false
      ;(grid[nr][nc].walls as Record<string, boolean>)[wallTo] = false
      visited[nr][nc] = true
      stack.push([nr, nc])
    }
  }

  return grid
}

/** DFS maze solver — generator yielding each step */
export function* mazeSolveSteps(
  grid: Grid,
  start: [number, number],
  end: [number, number],
): Generator<MazeStep> {
  const [sr, sc] = start
  const [er, ec] = end
  const visited: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  const path: [number, number][] = []
  const stack: [number, number][] = [[sr, sc]]

  yield {
    grid,
    current: [sr, sc],
    visited: [],
    path: [],
    start,
    end,
    description: `Start at [${sr},${sc}]. Goal: [${er},${ec}].`,
  }

  while (stack.length > 0) {
    const [r, c] = stack.pop()!

    if (visited[r][c]) continue
    visited[r][c] = true
    path.push([r, c])

    const visitedCells = visited
      .flatMap((row, ri) => row.map((v, ci) => (v ? [ri, ci] as [number, number] : null)))
      .filter(Boolean) as [number, number][]

    yield {
      grid,
      current: [r, c],
      visited: visitedCells,
      path: [...path],
      start,
      end,
      description: `Exploring [${r},${c}].${r === er && c === ec ? ' Found the exit!' : ''}`,
    }

    if (r === er && c === ec) {
      yield {
        grid,
        current: [r, c],
        visited: visitedCells,
        path: [...path],
        start,
        end,
        description: `Maze solved! Path length: ${path.length} cells.`,
      }
      return
    }

    const cell = grid[r][c]
    const neighbors: [number, number][] = []

    if (!cell.walls.bottom && r + 1 < ROWS && !visited[r + 1][c]) neighbors.push([r + 1, c])
    if (!cell.walls.right && c + 1 < COLS && !visited[r][c + 1]) neighbors.push([r, c + 1])
    if (!cell.walls.top && r - 1 >= 0 && !visited[r - 1][c]) neighbors.push([r - 1, c])
    if (!cell.walls.left && c - 1 >= 0 && !visited[r][c - 1]) neighbors.push([r, c - 1])

    if (neighbors.length === 0) {
      path.pop()
    } else {
      for (const n of neighbors) stack.push(n)
    }
  }

  const visitedCells = visited
    .flatMap((row, ri) => row.map((v, ci) => (v ? [ri, ci] as [number, number] : null)))
    .filter(Boolean) as [number, number][]

  yield {
    grid,
    current: null,
    visited: visitedCells,
    path: [],
    start,
    end,
    description: 'No path found.',
  }
}
