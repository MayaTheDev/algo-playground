export type KmpStep = {
  phase: 'build' | 'search'
  text: string
  pattern: string
  lps: number[]
  i: number
  j: number
  shift: number
  matches: number[]
  description: string
}

const PATTERN = 'ABABAC'
const TEXT = 'ZZABABABACYY'

export function* kmpSteps(): Generator<KmpStep> {
  const lps = new Array(PATTERN.length).fill(0)
  let len = 0
  let i = 1

  yield {
    phase: 'build',
    text: TEXT,
    pattern: PATTERN,
    lps: [...lps],
    i,
    j: len,
    shift: 0,
    matches: [],
    description: `Build the failure table for "${PATTERN}". It stores the longest proper prefix that is also a suffix at each position.`,
  }

  while (i < PATTERN.length) {
    yield {
      phase: 'build',
      text: TEXT,
      pattern: PATTERN,
      lps: [...lps],
      i,
      j: len,
      shift: 0,
      matches: [],
      description: `Compare pattern[${i}]="${PATTERN[i]}" with pattern[${len}]="${PATTERN[len]}".`,
    }

    if (PATTERN[i] === PATTERN[len]) {
      len++
      lps[i] = len
      yield {
        phase: 'build',
        text: TEXT,
        pattern: PATTERN,
        lps: [...lps],
        i,
        j: len,
        shift: 0,
        matches: [],
        description: `Match. lps[${i}] = ${len}. Reuse this overlap if a later mismatch happens.`,
      }
      i++
    } else if (len !== 0) {
      len = lps[len - 1]
      yield {
        phase: 'build',
        text: TEXT,
        pattern: PATTERN,
        lps: [...lps],
        i,
        j: len,
        shift: 0,
        matches: [],
        description: `Mismatch. Fall back to lps[${len}] instead of restarting from zero.`,
      }
    } else {
      lps[i] = 0
      i++
    }
  }

  let ti = 0
  let pj = 0
  const matches: number[] = []

  yield {
    phase: 'search',
    text: TEXT,
    pattern: PATTERN,
    lps: [...lps],
    i: ti,
    j: pj,
    shift: 0,
    matches: [...matches],
    description: 'Search the text. On mismatch, shift by what the failure table already proved safe.',
  }

  while (ti < TEXT.length) {
    yield {
      phase: 'search',
      text: TEXT,
      pattern: PATTERN,
      lps: [...lps],
      i: ti,
      j: pj,
      shift: ti - pj,
      matches: [...matches],
      description: `Compare text[${ti}]="${TEXT[ti]}" with pattern[${pj}]="${PATTERN[pj]}".`,
    }

    if (TEXT[ti] === PATTERN[pj]) {
      ti++
      pj++

      if (pj === PATTERN.length) {
        matches.push(ti - pj)
        yield {
          phase: 'search',
          text: TEXT,
          pattern: PATTERN,
          lps: [...lps],
          i: ti - 1,
          j: pj - 1,
          shift: ti - pj,
          matches: [...matches],
          description: `Match found at index ${ti - pj}. KMP keeps going without rescanning characters it already understands.`,
        }
        pj = lps[pj - 1]
      }
    } else if (pj !== 0) {
      pj = lps[pj - 1]
      yield {
        phase: 'search',
        text: TEXT,
        pattern: PATTERN,
        lps: [...lps],
        i: ti,
        j: pj,
        shift: ti - pj,
        matches: [...matches],
        description: `Mismatch. Jump pattern index back to ${pj} using the failure table instead of rewinding the text pointer.`,
      }
    } else {
      ti++
    }
  }

  yield {
    phase: 'search',
    text: TEXT,
    pattern: PATTERN,
    lps: [...lps],
    i: TEXT.length - 1,
    j: pj,
    shift: TEXT.length - pj,
    matches: [...matches],
    description: `Done. Matches at [${matches.join(', ')}]. The text pointer never moves backward.`,
  }
}
