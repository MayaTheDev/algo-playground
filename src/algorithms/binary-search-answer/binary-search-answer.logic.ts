/**
 * Binary search on the answer — Day 63.
 *
 * The batch export problem Chloe hit: a user asks for their whole account
 * history, it is too big for one worker, split it across several and finish as
 * fast as possible. How big should a chunk be?
 *
 * The instinct is to calculate it — total size over worker count. That fails,
 * because the rows are not uniform and one enormous row ruins the average.
 *
 * You do not have to calculate the answer. You can guess it and check the guess.
 * And because feasibility is monotonic — if a chunk size of 15 finishes in time
 * then so does 16 — the answers are sorted even though nobody sorted them.
 * Anything sorted, you can binary search.
 *
 *   formula   — total / workers, and watch it not work
 *   linear    — try every size from the bottom up; correct and slow
 *   binary    — guess, simulate, tighten
 */

export type BSAMode = 'formula' | 'linear' | 'binary'

/** row sizes — deliberately non-uniform, with one outlier */
export const ROWS = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 18, 2, 4, 1, 7]

export const WORKERS = 4

export const MIN_FEASIBLE = Math.max(...ROWS)
export const MAX_FEASIBLE = ROWS.reduce((a, b) => a + b, 0)

export type LogKind = 'probe' | 'ok' | 'fail' | 'narrow' | 'note'

export type LogLine = {
  kind: LogKind
  text: string
}

export type Verdict = {
  label: string
  probes: string
  answer: string
  note: string
}

export type BSAStep = {
  mode: BSAMode
  /** the capacity currently being tested */
  guess: number | null
  /** search window */
  lo: number
  hi: number
  /** how the rows packed under this guess: index -> worker number */
  packing: number[] | null
  /** workers required by the current guess */
  used: number | null
  /** did the guess fit within WORKERS */
  feasible: boolean | null
  /** every capacity tried so far, with its outcome */
  tried: { size: number; used: number; ok: boolean }[]
  /** index into CODE[mode] currently executing */
  codeLine: number | null
  /** number of feasibility simulations run */
  probes: number
  best: number | null
  verdict: Verdict | null
  log: LogLine[]
  phase: 'setup' | 'probe' | 'narrow' | 'verdict'
  description: string
}

export const MODE_LABELS: Record<BSAMode, string> = {
  formula: 'Formula',
  linear: 'Linear scan',
  binary: 'Binary search',
}

export const CODE: Record<BSAMode, string[]> = {
  formula: [
    '// the instinct',
    'const size = total / workerCount',
    '',
    '// the rows are not uniform.',
    '// one enormous row blows past',
    '// the average, and the worker',
    '// holding it runs long after',
    '// everyone else has finished.',
  ],
  linear: [
    'for (let size = maxRow; ; size++) {',
    '  if (fits(size, workers)) return size',
    '}',
    '',
    'function fits(size, workers) {',
    '  let used = 1, load = 0',
    '  for (const row of rows) {',
    '    if (load + row > size) { used++; load = 0 }',
    '    load += row',
    '  }',
    '  return used <= workers',
    '}',
  ],
  binary: [
    'let lo = maxRow, hi = totalBytes',
    'while (lo < hi) {',
    '  const guess = (lo + hi) >> 1',
    '  if (fits(guess, workers)) {',
    '    hi = guess        // maybe smaller works',
    '  } else {',
    '    lo = guess + 1    // definitely too small',
    '  }',
    '}',
    'return lo',
  ],
}

// ─── feasibility simulation ──────────────────────────────────────────────────

/** greedily pack rows into workers under a capacity; returns worker index per row */
function pack(capacity: number): { packing: number[]; used: number } {
  const packing: number[] = []
  let used = 1
  let load = 0
  for (const row of ROWS) {
    if (load + row > capacity) {
      used++
      load = 0
    }
    load += row
    packing.push(used - 1)
  }
  return { packing, used }
}

// ─── generator ───────────────────────────────────────────────────────────────

export function* bsaSteps(mode: BSAMode): Generator<BSAStep> {
  const log: LogLine[] = []
  const tried: { size: number; used: number; ok: boolean }[] = []
  let probes = 0

  const say = (kind: LogKind, text: string) => {
    log.push({ kind, text })
    if (log.length > 9) log.shift()
  }

  const emit = (
    partial: Partial<BSAStep> & { description: string; phase: BSAStep['phase'] },
  ): BSAStep => ({
    mode,
    guess: null,
    lo: MIN_FEASIBLE,
    hi: MAX_FEASIBLE,
    packing: null,
    used: null,
    feasible: null,
    tried: tried.map(t => ({ ...t })),
    codeLine: null,
    probes,
    best: null,
    verdict: null,
    log: [...log],
    ...partial,
  })

  const probe = (size: number) => {
    const { packing, used } = pack(size)
    const ok = used <= WORKERS
    probes++
    tried.push({ size, used, ok })
    return { packing, used, ok }
  }

  say('note', `${ROWS.length} rows, ${WORKERS} workers. Largest single row is ${MIN_FEASIBLE}.`)

  yield emit({
    phase: 'setup',
    codeLine: 0,
    description:
      mode === 'formula'
        ? 'The instinct is to compute the chunk size directly. Total size divided by worker count.'
        : mode === 'linear'
          ? `Try every capacity from ${MIN_FEASIBLE} upward until one fits. Correct, and it walks the whole range.`
          : `The answer is somewhere between ${MIN_FEASIBLE} — you cannot split a single row — and ${MAX_FEASIBLE}, one worker taking everything.`,
  })

  // ── formula ───────────────────────────────────────────────────────────────
  if (mode === 'formula') {
    const size = Math.ceil(MAX_FEASIBLE / WORKERS)
    const { packing, used, ok } = probe(size)
    say(ok ? 'ok' : 'fail', `size ${size} → needs ${used} workers`)

    yield emit({
      phase: 'probe',
      guess: size,
      packing,
      used,
      feasible: ok,
      codeLine: 1,
      description: `${MAX_FEASIBLE} / ${WORKERS} = ${size}. Simulate it: that needs ${used} workers, not ${WORKERS}.`,
    })

    yield emit({
      phase: 'verdict',
      guess: size,
      packing,
      used,
      feasible: ok,
      codeLine: 3,
      verdict: {
        label: 'Formula',
        probes: '1 simulation',
        answer: `${size} — and it does not fit`,
        note: `The average assumes the rows are interchangeable. They are not. The row of ${MIN_FEASIBLE} alone is larger than the average chunk, so the worker holding it overruns no matter how the rest is arranged.`,
      },
      description:
        'The formula produces a number quickly and the number is wrong. Averages hide outliers, and the outlier is the whole problem.',
    })
    return
  }

  // ── linear scan ───────────────────────────────────────────────────────────
  if (mode === 'linear') {
    for (let size = MIN_FEASIBLE; size <= MAX_FEASIBLE; size++) {
      const { packing, used, ok } = probe(size)
      say(ok ? 'ok' : 'fail', `size ${size} → ${used} workers ${ok ? '✓' : '✗'}`)

      yield emit({
        phase: 'probe',
        guess: size,
        packing,
        used,
        feasible: ok,
        codeLine: 1,
        best: ok ? size : null,
        description: ok
          ? `Capacity ${size} needs ${used} workers. That fits — and because we came up from the bottom, it is the smallest that does.`
          : `Capacity ${size} needs ${used} workers. Too many. Try one larger.`,
      })

      if (ok) {
        yield emit({
          phase: 'verdict',
          guess: size,
          packing,
          used,
          feasible: true,
          best: size,
          codeLine: null,
          verdict: {
            label: 'Linear scan',
            probes: `${probes} simulations`,
            answer: `${size}`,
            note: 'Correct, and it paid for every wrong guess along the way. Each simulation is a full pass over the rows, and it ran one for every capacity it skipped past.',
          },
          description: `Found it at ${size} — after ${probes} simulations. Every one of those was a full walk over the data.`,
        })
        return
      }
    }
  }

  // ── binary search ─────────────────────────────────────────────────────────
  let lo = MIN_FEASIBLE
  let hi = MAX_FEASIBLE

  while (lo < hi) {
    const guess = (lo + hi) >> 1
    const { packing, used, ok } = probe(guess)
    say('probe', `guess ${guess} → ${used} workers ${ok ? '✓' : '✗'}`)

    yield emit({
      phase: 'probe',
      guess,
      lo,
      hi,
      packing,
      used,
      feasible: ok,
      codeLine: 3,
      description: `Guess ${guess}. Simulate: it needs ${used} workers. ${ok ? 'That fits.' : 'Too many.'}`,
    })

    if (ok) {
      hi = guess
      say('narrow', `${guess} works → discard everything above it`)
      yield emit({
        phase: 'narrow',
        guess,
        lo,
        hi,
        packing,
        used,
        feasible: true,
        codeLine: 4,
        description: `${guess} fits, so every capacity above it fits too — that whole half is gone without simulating any of it. Window is now ${lo}–${hi}.`,
      })
    } else {
      lo = guess + 1
      say('narrow', `${guess} fails → discard it and everything below`)
      yield emit({
        phase: 'narrow',
        guess,
        lo,
        hi,
        packing,
        used,
        feasible: false,
        codeLine: 6,
        description: `${guess} does not fit, so nothing smaller can either. Window is now ${lo}–${hi}.`,
      })
    }
  }

  const final = pack(lo)
  yield emit({
    phase: 'verdict',
    guess: lo,
    lo,
    hi,
    packing: final.packing,
    used: final.used,
    feasible: true,
    best: lo,
    codeLine: 9,
    verdict: {
      label: 'Binary search on the answer',
      probes: `${probes} simulations`,
      answer: `${lo}`,
      note: 'Same answer as the linear scan, a fraction of the work. The trick is not the search — it is noticing that feasibility only runs one direction, which means the answers were sorted before anyone looked at them.',
    },
    description:
      'You do not have to calculate the answer. You can guess it, check the guess, and throw away half the remaining possibilities each time.',
  })
}
