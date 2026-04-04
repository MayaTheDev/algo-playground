/**
 * Bloom filter — Day 73.
 *
 * A Bloom filter answers one question: is this element in the set?
 *
 * It gives two different KINDS of answer, and the difference between them is the
 * whole point. "No" is definite — if any of the element's bits is 0, it was
 * never inserted, and there is no scenario in which the filter is wrong about
 * that. "Yes" is probabilistic — all the bits are set, but they might have been
 * set by other elements. A false positive is not a bug in the implementation.
 * It's the price of the space you saved.
 *
 * It never stores the elements. It stores k bits per element in a shared array,
 * which is why it's small, and why it can't tell you what it contains, and why
 * it can never remove anything.
 *
 * Three runs over the same five insertions:
 *   build    — watch the bits fill, see two words collide on a bit
 *   query    — a definite no, a true yes, and a false yes
 *   tradeoff — the same words and the same queries at 16, 32 and 64 bits
 */

export type BloomMode = 'build' | 'query' | 'tradeoff'

/** the words Maya actually inserts */
export const INSERTED = ['offer', 'staff', 'senior', 'friday', 'nelly'] as const

/** the query sequence: definite no, true yes, false yes */
export const QUERIES = ['marcus', 'offer', 'maybe'] as const

/** bit-array sizes compared in tradeoff mode */
export const SIZES = [16, 32, 64] as const

/** the default size for build and query modes */
export const M = 32

/** three independent hash functions = three different FNV-1a seeds */
const SEEDS = [0x9e3779b9, 0x85ebca6b, 0xc2b2ae35]
export const K = SEEDS.length

/** FNV-1a, seeded, folded into [0, m) */
export function bloomHash(s: string, seed: number, m: number): number {
  let x = (2166136261 ^ seed) >>> 0
  for (let i = 0; i < s.length; i++) {
    x = (x ^ s.charCodeAt(i)) >>> 0
    x = Math.imul(x, 16777619) >>> 0
  }
  return x % m
}

/** the k bit positions for a word, deduplicated and sorted */
export function bitsFor(s: string, m: number): number[] {
  const set = new Set<number>()
  for (const seed of SEEDS) set.add(bloomHash(s, seed, m))
  return [...set].sort((a, b) => a - b)
}

export type QueryVerdict = 'definitely-not' | 'probably' | 'false-positive'

export type LogKind = 'insert' | 'collide' | 'hit' | 'miss' | 'false' | 'note'

export type LogLine = {
  kind: LogKind
  text: string
}

export type SizeRow = {
  m: number
  bitsSet: number
  load: number
  /** measured false positives over the probe pool */
  falsePositives: number
  probed: number
  /** did the word "maybe" false-positive at this size */
  maybeFalse: boolean
}

export type Verdict = {
  label: string
  headline: string
  detail: string
  note: string
}

export type BloomStep = {
  mode: BloomMode
  m: number
  /** the bit array */
  bits: number[]
  /** bits touched by the current operation */
  active: number[]
  /** bits that were already 1 before this operation touched them */
  collisions: number[]
  /** the word being inserted or queried */
  word: string | null
  /** for query mode: which bit proved the answer */
  decidingBit: number | null
  verdictForWord: QueryVerdict | null
  /** index into CODE[mode] */
  codeLine: number | null
  bitsSet: number
  /** tradeoff mode only */
  sizes: SizeRow[]
  verdict: Verdict | null
  log: LogLine[]
  phase: 'setup' | 'insert' | 'query' | 'compare' | 'verdict'
  description: string
}

export const MODE_LABELS: Record<BloomMode, string> = {
  build: 'Fill the filter',
  query: 'Ask it three things',
  tradeoff: 'Size vs. lying',
}

export const CODE: Record<BloomMode, string[]> = {
  build: [
    'function add(word) {',
    '  for (const seed of SEEDS) {',
    '    const i = hash(word, seed) % m',
    '    bits[i] = 1          // no check',
    '  }',
    '}',
    '',
    '// bits are shared. nothing records',
    '// WHICH word set a bit — so nothing',
    '// can ever be removed.',
  ],
  query: [
    'function has(word) {',
    '  for (const seed of SEEDS) {',
    '    const i = hash(word, seed) % m',
    '    if (bits[i] === 0) {',
    '      return false       // DEFINITE',
    '    }',
    '  }',
    '  return true            // probable',
    '}',
  ],
  tradeoff: [
    '// expected false-positive rate',
    '//   p ≈ (1 - e^(-kn/m))^k',
    '',
    '// n = items, k = hashes, m = bits',
    '// n and k are fixed here.',
    '// only m changes.',
    '',
    '// you are not choosing between',
    '// right and wrong. you are choosing',
    '// how often you accept being wrong.',
  ],
}

/** words used only to measure the false-positive rate — never inserted */
const PROBE_POOL = [
  'marcus',
  'eli',
  'chloe',
  'sandra',
  'priya',
  'jordan',
  'hana',
  'leo',
  'mom',
  'intern',
  'contract',
  'equity',
  'remote',
  'onsite',
  'recruiter',
  'pathway',
  'headcount',
  'rejection',
  'probably',
  'definitely',
  'maybe',
  'certainty',
  'waiting',
  'answer',
  'monday',
  'thursday',
]

function filledArray(m: number): number[] {
  const bits = new Array<number>(m).fill(0)
  for (const w of INSERTED) for (const i of bitsFor(w, m)) bits[i] = 1
  return bits
}

function measure(m: number): SizeRow {
  const bits = filledArray(m)
  const bitsSet = bits.reduce((a, b) => a + b, 0)
  let falsePositives = 0
  for (const w of PROBE_POOL) {
    if (bitsFor(w, m).every(i => bits[i] === 1)) falsePositives++
  }
  return {
    m,
    bitsSet,
    load: bitsSet / m,
    falsePositives,
    probed: PROBE_POOL.length,
    maybeFalse: bitsFor('maybe', m).every(i => bits[i] === 1),
  }
}

// ─── generator ───────────────────────────────────────────────────────────────

export function* bloomFilterSteps(mode: BloomMode): Generator<BloomStep> {
  const m = M
  const bits = new Array<number>(m).fill(0)
  const log: LogLine[] = []

  const say = (kind: LogKind, text: string) => {
    log.push({ kind, text })
    if (log.length > 9) log.shift()
  }

  const emit = (
    partial: Partial<BloomStep> & { description: string; phase: BloomStep['phase'] },
  ): BloomStep => ({
    mode,
    m,
    bits: [...bits],
    active: [],
    collisions: [],
    word: null,
    decidingBit: null,
    verdictForWord: null,
    codeLine: null,
    bitsSet: bits.reduce((a, b) => a + b, 0),
    sizes: [],
    verdict: null,
    log: [...log],
    ...partial,
  })

  // ── tradeoff mode is a table, not a walk ──────────────────────────────────
  if (mode === 'tradeoff') {
    const rows: SizeRow[] = []
    say('note', `same ${INSERTED.length} words, same ${K} hashes, ${PROBE_POOL.length} probes`)
    yield emit({
      phase: 'setup',
      sizes: [],
      codeLine: 0,
      description: `Five words, three hash functions, and ${PROBE_POOL.length} words that were never inserted. The only thing that changes is how many bits the filter is allowed to use.`,
    })

    for (const size of SIZES) {
      const row = measure(size)
      rows.push(row)
      say(
        row.falsePositives === 0 ? 'hit' : 'false',
        `m=${size}: ${row.bitsSet}/${size} bits set, ${row.falsePositives} false positive${row.falsePositives === 1 ? '' : 's'}`,
      )
      yield emit({
        phase: 'compare',
        sizes: [...rows],
        codeLine: 1,
        description:
          row.falsePositives === 0
            ? `At ${size} bits the array is ${Math.round(row.load * 100)}% full and not one of the ${PROBE_POOL.length} probes comes back a false yes.`
            : `At ${size} bits the array is ${Math.round(row.load * 100)}% full, and ${row.falsePositives} of ${PROBE_POOL.length} words that were never inserted come back as "probably yes".`,
      })
    }

    const first = rows[0]
    const last = rows[rows.length - 1]
    yield emit({
      phase: 'verdict',
      sizes: rows,
      codeLine: 9,
      verdict: {
        label: 'Size vs. lying',
        headline: `${Math.round((first.falsePositives / first.probed) * 100)}% wrong at ${first.m} bits → ${Math.round((last.falsePositives / last.probed) * 100)}% at ${last.m} bits`,
        detail: `${last.m / first.m}× the memory for the same five words`,
        note: 'Nothing about the algorithm changed between those rows. The only variable is how much space you were willing to spend, and the false-positive rate is what you bought with it. This is the shape of most real engineering decisions: not a correct answer, a priced one.',
      },
      description:
        'A Bloom filter does not have a bug rate. It has a configured rate, and somebody chose it.',
    })
    return
  }

  say('note', `${m} bits, all zero. ${K} hash functions per word.`)
  yield emit({
    phase: 'setup',
    codeLine: 0,
    description:
      mode === 'build'
        ? `An empty bit array — ${m} bits, no words. Each word that goes in will set ${K} of them.`
        : `The filter already holds ${INSERTED.length} words. Now watch what kind of answer it gives.`,
  })

  // ── insert the words ──────────────────────────────────────────────────────
  for (const word of INSERTED) {
    const idx = bitsFor(word, m)
    const already = idx.filter(i => bits[i] === 1)
    for (const i of idx) bits[i] = 1

    if (mode === 'build') {
      say(
        already.length > 0 ? 'collide' : 'insert',
        already.length > 0
          ? `add("${word}") → bits ${idx.join(', ')} — bit ${already.join(', ')} already set`
          : `add("${word}") → bits ${idx.join(', ')}`,
      )
      yield emit({
        phase: 'insert',
        word,
        active: idx,
        collisions: already,
        codeLine: 3,
        description:
          already.length > 0
            ? `"${word}" hashes to ${idx.join(', ')}, and bit ${already.join(' and ')} was already 1. The filter does not notice and does not care — there is nowhere to record that two words share a bit. That sharing is exactly what makes false positives possible later.`
            : `"${word}" hashes to three positions — ${idx.join(', ')} — and all three flip to 1.`,
      })
    }
  }

  if (mode === 'build') {
    const set = bits.reduce((a, b) => a + b, 0)
    yield emit({
      phase: 'verdict',
      codeLine: 7,
      verdict: {
        label: 'Five words stored',
        headline: `${set} of ${m} bits set`,
        detail: `${INSERTED.length} words × ${K} hashes, minus collisions`,
        note: 'The words are gone. What remains is a pattern of bits that those words would produce — which is enough to rule something out, and never enough to list what is in here. There is also no delete: clearing a bit would erase it for every word that shares it.',
      },
      description:
        'The filter cannot tell you what it contains. It can only tell you what it has definitely never seen.',
    })
    return
  }

  // ── query mode ────────────────────────────────────────────────────────────
  say('note', 'three questions, two different kinds of answer')
  for (const word of QUERIES) {
    const idx = bitsFor(word, m)
    const zero = idx.find(i => bits[i] === 0)
    const wasInserted = (INSERTED as readonly string[]).includes(word)

    if (zero !== undefined) {
      say('miss', `has("${word}") → bit ${zero} is 0 → definitely not`)
      yield emit({
        phase: 'query',
        word,
        active: idx,
        decidingBit: zero,
        verdictForWord: 'definitely-not',
        codeLine: 4,
        description: `"${word}" hashes to ${idx.join(', ')}. Bit ${zero} is 0, so the loop returns immediately. This answer is certain: if "${word}" had ever been inserted, bit ${zero} would be 1. A Bloom filter cannot produce a false negative.`,
      })
      continue
    }

    if (wasInserted) {
      say('hit', `has("${word}") → all bits set → probably (and it is)`)
      yield emit({
        phase: 'query',
        word,
        active: idx,
        verdictForWord: 'probably',
        codeLine: 7,
        description: `"${word}" has all ${K} bits set, so the filter says yes. It is right — "${word}" was inserted. But notice the filter did not verify that. It cannot. It saw three 1s.`,
      })
      continue
    }

    say('false', `has("${word}") → all bits set → WRONG`)
    yield emit({
      phase: 'query',
      word,
      active: idx,
      verdictForWord: 'false-positive',
      codeLine: 7,
      description: `"${word}" has all ${K} bits set — ${idx.join(', ')} — so the filter says yes. "${word}" was never inserted. Those three bits were set by other words, and the filter has no way to know that. This is a false positive, and it is not a defect.`,
    })
  }

  yield emit({
    phase: 'verdict',
    codeLine: 4,
    verdict: {
      label: 'Two kinds of answer',
      headline: 'no = certain · yes = probable',
      detail: `${QUERIES.length} queries, 1 false positive`,
      note: 'This is why a Bloom filter sits in FRONT of the expensive thing. A "no" short-circuits the database call with total confidence. A "yes" means go and check properly. It is not a cache. It is a way of being certain about absence, which turns out to be most of what you need.',
    },
    description:
      'The filter never lies about absence. It only ever overstates presence — and you decide how often, when you pick the size.',
  })
}
