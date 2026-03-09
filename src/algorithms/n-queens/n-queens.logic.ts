export type NQueensAction =
  | 'start'
  | 'place'
  | 'reject'
  | 'backtrack'
  | 'solution'
  | 'exhausted'
  | 'done'

export type NQueensStep = {
  n: number
  /** board[row] = column of the queen on that row, or null if the row is empty */
  board: (number | null)[]
  /** Row the search is currently working on */
  row: number
  /** Column being attempted on `row`, if any */
  col: number | null
  action: NQueensAction
  /** Why the attempted square failed, plus the queen that vetoed it */
  conflict: { row: number; col: number; reason: 'column' | 'diagonal' } | null
  /** Squares attacked by the queens currently on the board */
  attacked: string[]
  /** Placements the algorithm actually evaluated */
  explored: number
  /** Placements rejected — each one cuts an entire subtree it never walks */
  pruned: number
  /**
   * Complete arrangements the search never walked, because a rejection cut the
   * subtree above them. Measured against the n^n one-queen-per-row space.
   */
  skipped: number
  solutions: number[][]
  description: string
}

/** Row-per-queen search space: one column choice per row — n^n */
export function rowSpace(n: number): number {
  return Math.pow(n, n)
}

/** Exhaustive placements of n queens on n×n squares — C(n², n) */
export function totalPlacements(n: number): number {
  const squares = n * n
  let result = 1
  for (let i = 0; i < n; i++) {
    result = (result * (squares - i)) / (i + 1)
  }
  return Math.round(result)
}

function key(row: number, col: number): string {
  return `${row},${col}`
}

/** Every square attacked by a queen already on the board */
function attackedSquares(board: (number | null)[], n: number): string[] {
  const out = new Set<string>()
  for (let r = 0; r < n; r++) {
    const c = board[r]
    if (c === null) continue
    for (let rr = 0; rr < n; rr++) {
      for (let cc = 0; cc < n; cc++) {
        if (rr === r && cc === c) continue
        if (cc === c || Math.abs(rr - r) === Math.abs(cc - c)) out.add(key(rr, cc))
      }
    }
  }
  return [...out]
}

/** First queen that vetoes (row, col), or null if the square is safe */
function findConflict(
  board: (number | null)[],
  row: number,
  col: number,
): { row: number; col: number; reason: 'column' | 'diagonal' } | null {
  for (let r = 0; r < row; r++) {
    const c = board[r]
    if (c === null) continue
    if (c === col) return { row: r, col: c, reason: 'column' }
    if (Math.abs(row - r) === Math.abs(col - c)) return { row: r, col: c, reason: 'diagonal' }
  }
  return null
}

/**
 * Node counts for the full backtracking search — computed without yielding, so
 * the "pruning at scale" panel can quote real numbers for board sizes that
 * would take far too many frames to animate.
 */
export function searchStats(n: number): {
  explored: number
  pruned: number
  solutions: number
  total: number
} {
  let explored = 0
  let pruned = 0
  let solutions = 0
  const board: (number | null)[] = Array(n).fill(null)

  const walk = (row: number) => {
    if (row === n) {
      solutions += 1
      return
    }
    for (let col = 0; col < n; col++) {
      explored += 1
      if (findConflict(board, row, col) !== null) {
        pruned += 1
        continue
      }
      board[row] = col
      walk(row + 1)
      board[row] = null
    }
  }

  walk(0)
  return { explored, pruned, solutions, total: totalPlacements(n) }
}

export const BOARD_SIZES = [4, 5, 6, 8] as const
export type BoardSize = (typeof BOARD_SIZES)[number]

/**
 * How many solutions to animate before stopping. Small boards run to completion;
 * larger ones stop at the first valid arrangement, because 8-queens needs 1,087
 * decisions to reach it and the frame count is the point being made, not the tail.
 */
function solutionLimit(n: number): number {
  return n <= 5 ? 4 : 1
}

export function* nQueensSteps(n: number): Generator<NQueensStep> {
  const board: (number | null)[] = Array(n).fill(null)
  const solutions: number[][] = []
  let explored = 0
  let pruned = 0
  let skipped = 0
  let truncated = false

  const emit = (
    overrides: Partial<NQueensStep> & { action: NQueensAction; description: string },
  ): NQueensStep => ({
    n,
    board: [...board],
    row: 0,
    col: null,
    conflict: null,
    attacked: attackedSquares(board, n),
    explored,
    pruned,
    skipped,
    solutions: solutions.map(s => [...s]),
    ...overrides,
  })

  yield emit({
    action: 'start',
    description:
      `${n} queens on a ${n}×${n} board, none attacking each other. ` +
      `Brute force would check all ${totalPlacements(n).toLocaleString()} ways to drop ${n} queens ` +
      `on ${n * n} squares. Backtracking will not.`,
  })

  function* solve(row: number): Generator<NQueensStep, boolean> {
    if (row === n) {
      solutions.push(board.map(c => c as number))
      yield emit({
        row: row - 1,
        action: 'solution',
        description:
          `Solution ${solutions.length}: rows map to columns [${board.join(', ')}]. ` +
          `${n} queens placed, zero conflicts.`,
      })
      if (solutions.length >= solutionLimit(n)) {
        truncated = true
        return true
      }
      return false
    }

    for (let col = 0; col < n; col++) {
      explored += 1
      const conflict = findConflict(board, row, col)

      if (conflict !== null) {
        pruned += 1
        // Rejecting here removes every completion of this partial board
        skipped += Math.pow(n, n - 1 - row)
        yield emit({
          row,
          col,
          action: 'reject',
          conflict,
          description:
            `Row ${row}, column ${col} is attacked by the queen at (${conflict.row}, ${conflict.col}) ` +
            `on the same ${conflict.reason}. Reject — and with it, every arrangement that would have ` +
            `started this way. Never explored.`,
        })
        continue
      }

      board[row] = col
      yield emit({
        row,
        col,
        action: 'place',
        description:
          `Row ${row}, column ${col} is safe. Place the queen and descend to row ${row + 1}. ` +
          `Commit to the choice, then find out.`,
      })

      const stop = yield* solve(row + 1)
      if (stop) return true

      board[row] = null
      yield emit({
        row,
        col,
        action: 'backtrack',
        description:
          `Row ${row + 1} ran out of safe columns. Back out to the last valid state — ` +
          `lift the queen off (${row}, ${col}) and try the next column.`,
      })
    }

    if (row > 0) {
      yield emit({
        row,
        action: 'exhausted',
        description:
          `Every column in row ${row} is attacked. This whole branch is dead. Return to row ${row - 1}.`,
      })
    }
    return false
  }

  yield* solve(0)

  const stats = searchStats(n)
  yield emit({
    action: 'done',
    description:
      (truncated
        ? `Stopped after ${solutions.length} solution${solutions.length === 1 ? '' : 's'} — a full run finds ${stats.solutions}. `
        : `Search complete — ${solutions.length} solution${solutions.length === 1 ? '' : 's'}. `) +
      `A full ${n}-queens run evaluates ${stats.explored.toLocaleString()} placements and rejects ` +
      `${stats.pruned.toLocaleString()} of them, out of ${stats.total.toLocaleString()} possible ` +
      `arrangements. The pruning is the algorithm.`,
  })
}
