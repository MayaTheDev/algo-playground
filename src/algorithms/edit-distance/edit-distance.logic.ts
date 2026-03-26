/**
 * Edit distance (Levenshtein) — Day 77.
 *
 * The minimum number of single-character edits — insert, delete, substitute —
 * to turn one string into another.
 *
 * You build a table, one row per character of the first string, one column per
 * character of the second. Each cell asks a small question. If the characters
 * match, the answer is whatever was diagonally behind it, because nothing had to
 * change. If they don't, it's one plus the cheapest of three neighbours: above
 * (delete), left (insert), diagonal (substitute).
 *
 * The number in the bottom-right corner is not the useful output. The useful
 * output is the PATH — walk backward through the cells you came from and you get
 * the actual list of operations. That's a diff. That's what `git diff` has been
 * showing you all along.
 *
 * And the table has no opinion about which string is better. It measures
 * distance, not direction.
 */

export type EditMode = 'table' | 'path'

export const SOURCE = 'strong fit'
export const TARGET = 'still learning'

export type Op = 'match' | 'substitute' | 'insert' | 'delete'

export type Cell = {
  i: number
  j: number
  value: number
  /** which neighbour this value came from */
  from: Op | null
}

export type LogKind = 'fill' | 'match' | 'edit' | 'path' | 'note'

export type LogLine = {
  kind: LogKind
  text: string
}

export type PathOp = {
  op: Op
  char: string
  at: number
}

export type Verdict = {
  label: string
  distance: string
  ops: string
  note: string
}

export type EditStep = {
  mode: EditMode
  /** grid[i][j] — i over source, j over target */
  grid: (Cell | null)[][]
  /** cell currently being computed */
  cursor: [number, number] | null
  /** the three neighbours being compared */
  candidates: [number, number][]
  /** cells on the traced backward path */
  path: [number, number][]
  /** operations recovered from the path */
  ops: PathOp[]
  /** index into CODE[mode] */
  codeLine: number | null
  /** cells computed so far */
  filled: number
  distance: number | null
  verdict: Verdict | null
  log: LogLine[]
  phase: 'setup' | 'fill' | 'trace' | 'verdict'
  description: string
}

export const MODE_LABELS: Record<EditMode, string> = {
  table: 'Fill the table',
  path: 'Trace the diff',
}

export const CODE: Record<EditMode, string[]> = {
  table: [
    'for (let i = 1; i <= a.length; i++) {',
    '  for (let j = 1; j <= b.length; j++) {',
    '    if (a[i-1] === b[j-1]) {',
    '      dp[i][j] = dp[i-1][j-1]   // free',
    '    } else {',
    '      dp[i][j] = 1 + Math.min(',
    '        dp[i-1][j],   // delete',
    '        dp[i][j-1],   // insert',
    '        dp[i-1][j-1]) // substitute',
    '    }',
    '  }',
    '}',
  ],
  path: [
    '// the number is not the output.',
    '// the PATH is the output.',
    'let i = a.length, j = b.length',
    'while (i > 0 || j > 0) {',
    '  const op = cameFrom[i][j]',
    '  ops.unshift(op)',
    '  // step back to that neighbour',
    '}',
    '',
    '// this list is a diff.',
  ],
}

// ─── generator ───────────────────────────────────────────────────────────────

export function* editDistanceSteps(mode: EditMode): Generator<EditStep> {
  const a = SOURCE
  const b = TARGET
  const n = a.length
  const m = b.length

  const grid: (Cell | null)[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => null),
  )
  const log: LogLine[] = []
  let filled = 0

  const say = (kind: LogKind, text: string) => {
    log.push({ kind, text })
    if (log.length > 9) log.shift()
  }

  const emit = (
    partial: Partial<EditStep> & { description: string; phase: EditStep['phase'] },
  ): EditStep => ({
    mode,
    grid: grid.map(row => row.map(c => (c ? { ...c } : null))),
    cursor: null,
    candidates: [],
    path: [],
    ops: [],
    codeLine: null,
    filled,
    distance: null,
    verdict: null,
    log: [...log],
    ...partial,
  })

  // base row/column
  for (let i = 0; i <= n; i++) grid[i][0] = { i, j: 0, value: i, from: 'delete' }
  for (let j = 0; j <= m; j++) grid[0][j] = { i: 0, j, value: j, from: 'insert' }
  grid[0][0] = { i: 0, j: 0, value: 0, from: null }

  say('note', `"${a}" → "${b}". Table is ${n + 1} × ${m + 1}.`)
  yield emit({
    phase: 'setup',
    codeLine: 0,
    description:
      'Row zero and column zero are the base cases: turning a string into nothing costs one deletion per character, and building it from nothing costs one insertion per character.',
  })

  // ── fill ──────────────────────────────────────────────────────────────────
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = a[i - 1] === b[j - 1]
      const diag = grid[i - 1][j - 1]!.value
      const up = grid[i - 1][j]!.value
      const left = grid[i][j - 1]!.value

      let value: number
      let from: Op
      if (same) {
        value = diag
        from = 'match'
      } else {
        const best = Math.min(up, left, diag)
        value = best + 1
        from = best === diag ? 'substitute' : best === up ? 'delete' : 'insert'
      }

      grid[i][j] = { i, j, value, from }
      filled++

      // only narrate a sample of cells, or the table takes forever to watch
      const narrate = mode === 'table' && (same || j === m || filled % 7 === 0)
      if (narrate) {
        say(
          same ? 'match' : 'edit',
          same
            ? `'${a[i - 1]}' matches — free, take the diagonal (${value})`
            : `'${a[i - 1]}' vs '${b[j - 1]}' — 1 + min(${up},${left},${diag}) = ${value}`,
        )
        yield emit({
          phase: 'fill',
          cursor: [i, j],
          candidates: [
            [i - 1, j],
            [i, j - 1],
            [i - 1, j - 1],
          ],
          codeLine: same ? 3 : 5,
          description: same
            ? `'${a[i - 1]}' and '${b[j - 1]}' are the same character, so nothing has to change here — inherit the diagonal value, ${value}.`
            : `'${a[i - 1]}' and '${b[j - 1]}' differ. Take the cheapest neighbour and add one: ${value} via ${from}.`,
        })
      }
    }
  }

  const distance = grid[n][m]!.value
  say('note', `bottom-right = ${distance}`)
  yield emit({
    phase: 'fill',
    cursor: [n, m],
    distance,
    codeLine: 11,
    description: `Table complete. The bottom-right corner is ${distance} — the minimum number of edits between the two strings.`,
  })

  if (mode === 'table') {
    yield emit({
      phase: 'verdict',
      cursor: [n, m],
      distance,
      codeLine: null,
      verdict: {
        label: 'Levenshtein distance',
        distance: `${distance} edits`,
        ops: `${filled} cells computed`,
        note: 'O(n × m) time and space. Every cell asks one small question, and the answer to the whole problem falls out of the last one. Switch to "Trace the diff" to see what the number is hiding.',
      },
      description:
        'The number is the cheap output. The interesting one is the path that produced it.',
    })
    return
  }

  // ── trace ─────────────────────────────────────────────────────────────────
  const path: [number, number][] = []
  const ops: PathOp[] = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    path.push([i, j])
    const cell = grid[i][j]!
    const op = cell.from ?? (i > 0 ? 'delete' : 'insert')

    if (op === 'match' || op === 'substitute') {
      ops.unshift({ op, char: op === 'match' ? a[i - 1] : b[j - 1], at: i - 1 })
      i--
      j--
    } else if (op === 'delete') {
      ops.unshift({ op, char: a[i - 1], at: i - 1 })
      i--
    } else {
      ops.unshift({ op, char: b[j - 1], at: j - 1 })
      j--
    }

    if (path.length % 3 === 0 || i === 0 || j === 0) {
      say('path', `${op} '${ops[0].char}'`)
      yield emit({
        phase: 'trace',
        cursor: [i, j],
        path: [...path],
        ops: [...ops],
        distance,
        codeLine: 4,
        description: `Walking backward. Each cell remembers which neighbour it came from, and that memory is the operation: ${op}.`,
      })
    }
  }

  path.push([0, 0])
  const edits = ops.filter(o => o.op !== 'match').length

  yield emit({
    phase: 'verdict',
    path: [...path],
    ops: [...ops],
    distance,
    codeLine: 9,
    verdict: {
      label: 'The path is a diff',
      distance: `${distance} edits`,
      ops: `${edits} operations, ${ops.length - edits} characters kept`,
      note: 'This list — keep, insert, delete, substitute — is exactly what a diff tool prints. Two months of reading git diffs without knowing there was a dynamic programming table underneath.',
    },
    description:
      'The table measured the distance exactly and has no opinion about which string is better. Distance is not direction.',
  })
}
