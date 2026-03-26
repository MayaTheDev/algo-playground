/**
 * Quickselect — Day 71.
 *
 * Find the kth largest element in an unsorted array.
 *
 * The min-heap answer is the one you give a month in: keep a heap of size k,
 * O(n log k), never hold more than k elements. It is a perfectly good answer.
 *
 * But if you are allowed to destroy the input, quickselect does it in O(n)
 * average. Partition around a pivot, look at where the pivot lands, and recurse
 * into only the side that can contain the answer. You never sort the half you
 * do not need.
 *
 * The follow-up nobody asks until you have already said it: worst case is O(n²)
 * when the pivots are adversarial, which is why you randomize the pivot.
 *
 *   sort       — sort everything, take index k. Correct, wasteful.
 *   heap       — a min-heap of size k.
 *   quickselect— partition, discard half, repeat.
 */

export type QSMode = 'sort' | 'heap' | 'quickselect'

export const ARRAY = [7, 10, 4, 3, 20, 15, 8, 12, 2, 18, 6, 11]
export const K = 4 // 4th largest

export type LogKind = 'compare' | 'swap' | 'pivot' | 'discard' | 'heap' | 'note'

export type LogLine = {
  kind: LogKind
  text: string
}

export type Verdict = {
  label: string
  work: string
  complexity: string
  note: string
}

export type QSStep = {
  mode: QSMode
  values: number[]
  /** active search window [lo, hi] */
  lo: number
  hi: number
  /** current pivot index */
  pivot: number | null
  /** indices being compared/swapped */
  active: number[]
  /** indices already discarded from consideration */
  discarded: number[]
  /** heap contents — heap mode only */
  heap: number[]
  /** the answer, once found */
  answer: number | null
  /** index into CODE[mode] */
  codeLine: number | null
  /** element comparisons performed */
  comparisons: number
  verdict: Verdict | null
  log: LogLine[]
  phase: 'setup' | 'partition' | 'discard' | 'heap' | 'verdict'
  description: string
}

export const MODE_LABELS: Record<QSMode, string> = {
  sort: 'Full sort',
  heap: 'Min-heap of k',
  quickselect: 'Quickselect',
}

export const CODE: Record<QSMode, string[]> = {
  sort: [
    'function kthLargest(nums, k) {',
    '  nums.sort((a, b) => b - a)',
    '  return nums[k - 1]',
    '}',
    '',
    '// O(n log n).',
    '// you sorted the whole array',
    '// to answer one question about it.',
  ],
  heap: [
    'function kthLargest(nums, k) {',
    '  const heap = new MinHeap()',
    '  for (const n of nums) {',
    '    heap.push(n)',
    '    if (heap.size() > k) heap.pop()',
    '  }',
    '  return heap.peek()   // the weakest survivor',
    '}  // O(n log k), O(k) space',
  ],
  quickselect: [
    'function select(nums, lo, hi, target) {',
    '  const p = partition(nums, lo, hi)',
    '  if (p === target) return nums[p]',
    '  if (p < target) {',
    '    return select(nums, p + 1, hi, target)',
    '  } else {',
    '    return select(nums, lo, p - 1, target)',
    '  }',
    '}  // O(n) average, O(n^2) adversarial',
  ],
}

// ─── generator ───────────────────────────────────────────────────────────────

export function* quickselectSteps(mode: QSMode): Generator<QSStep> {
  const values = [...ARRAY]
  const log: LogLine[] = []
  const discarded: number[] = []
  let comparisons = 0
  let heap: number[] = []

  const say = (kind: LogKind, text: string) => {
    log.push({ kind, text })
    if (log.length > 9) log.shift()
  }

  const emit = (
    partial: Partial<QSStep> & { description: string; phase: QSStep['phase'] },
  ): QSStep => ({
    mode,
    values: [...values],
    lo: 0,
    hi: values.length - 1,
    pivot: null,
    active: [],
    discarded: [...discarded],
    heap: [...heap],
    answer: null,
    codeLine: null,
    comparisons,
    verdict: null,
    log: [...log],
    ...partial,
  })

  const target = K - 1 // index in descending order

  say('note', `${values.length} values, unsorted. Find the ${K}th largest.`)
  yield emit({
    phase: 'setup',
    codeLine: 0,
    description:
      mode === 'sort'
        ? 'The direct approach: sort everything descending, then index in.'
        : mode === 'heap'
          ? `Keep a min-heap of size ${K}. Its root is the weakest of the best — first to be evicted.`
          : 'Partition around a pivot. Wherever the pivot lands is its final sorted position — which tells you which half to throw away.',
  })

  // ── full sort ─────────────────────────────────────────────────────────────
  if (mode === 'sort') {
    const sorted = [...values].sort((a, b) => b - a)
    comparisons = Math.ceil(values.length * Math.log2(values.length))
    for (let i = 0; i < values.length; i++) values[i] = sorted[i]
    say('note', `sorted all ${values.length} elements`)
    yield emit({
      phase: 'partition',
      codeLine: 1,
      description: `Whole array sorted descending. Roughly ${comparisons} comparisons — and we only needed one element out of it.`,
    })
    yield emit({
      phase: 'verdict',
      codeLine: 2,
      answer: sorted[target],
      active: [target],
      verdict: {
        label: 'Full sort',
        work: `~${comparisons} comparisons`,
        complexity: 'O(n log n)',
        note: `Correct and wasteful. Every element was placed in its exact final position, and ${values.length - 1} of those placements were thrown away unread.`,
      },
      description: `The ${K}th largest is ${sorted[target]}. We did an enormous amount of work we never looked at.`,
    })
    return
  }

  // ── min-heap of k ─────────────────────────────────────────────────────────
  if (mode === 'heap') {
    for (let i = 0; i < values.length; i++) {
      const v = values[i]
      heap.push(v)
      heap.sort((a, b) => a - b)
      comparisons += Math.ceil(Math.log2(Math.max(heap.length, 2)))
      const evicted = heap.length > K ? heap.shift() : null

      say('heap', evicted !== null ? `push ${v}, evict ${evicted}` : `push ${v}`)
      yield emit({
        phase: 'heap',
        active: [i],
        codeLine: evicted !== null ? 4 : 3,
        description:
          evicted !== null
            ? `Push ${v}, then evict ${evicted} — the heap only ever holds the ${K} best seen so far.`
            : `Push ${v}. Heap is still filling to size ${K}.`,
      })
    }
    yield emit({
      phase: 'verdict',
      codeLine: 6,
      answer: heap[0],
      verdict: {
        label: 'Min-heap of k',
        work: `~${comparisons} comparisons`,
        complexity: `O(n log k), O(k) space`,
        note: `The counterintuitive part is using a MIN-heap to track the largest. The root is the weakest member of the winning set, so it is the correct thing to evict. This is the answer to give when you are not allowed to modify the input.`,
      },
      description: `The heap root is ${heap[0]} — the weakest of the top ${K}, which is exactly the ${K}th largest.`,
    })
    return
  }

  // ── quickselect ───────────────────────────────────────────────────────────
  let lo = 0
  let hi = values.length - 1

  while (lo <= hi) {
    // partition descending: larger values to the left
    const pivotVal = values[hi]
    say('pivot', `pivot = ${pivotVal} (randomize this in production)`)
    yield emit({
      phase: 'partition',
      lo,
      hi,
      pivot: hi,
      codeLine: 1,
      description: `Partition ${lo}–${hi} around pivot ${pivotVal}. Everything larger goes left, everything smaller goes right.`,
    })

    let store = lo
    for (let i = lo; i < hi; i++) {
      comparisons++
      if (values[i] > pivotVal) {
        ;[values[i], values[store]] = [values[store], values[i]]
        store++
      }
    }
    ;[values[store], values[hi]] = [values[hi], values[store]]

    say('swap', `pivot ${pivotVal} settles at index ${store}`)
    yield emit({
      phase: 'partition',
      lo,
      hi,
      pivot: store,
      active: [store],
      codeLine: 1,
      description: `${pivotVal} is now at index ${store}, and that is its final sorted position — everything left of it is larger, everything right is smaller.`,
    })

    if (store === target) {
      yield emit({
        phase: 'verdict',
        lo,
        hi,
        pivot: store,
        active: [store],
        answer: values[store],
        codeLine: 2,
        verdict: {
          label: 'Quickselect',
          work: `${comparisons} comparisons`,
          complexity: 'O(n) average, O(n²) adversarial',
          note: 'Half the remaining elements are discarded at every step and never looked at again. The worst case is quadratic when the pivots are adversarial — which is why you randomize the pivot rather than always taking the last element.',
        },
        description: `Index ${store} is the target. The ${K}th largest is ${values[store]} — and most of the array was never sorted at all.`,
      })
      return
    }

    if (store < target) {
      for (let i = lo; i <= store; i++) if (!discarded.includes(i)) discarded.push(i)
      say('discard', `target is right of ${store} — discard ${store - lo + 1} elements`)
      lo = store + 1
      yield emit({
        phase: 'discard',
        lo,
        hi,
        pivot: store,
        codeLine: 4,
        description: `The answer sits right of index ${store}. Everything from ${discarded.length} elements leftward is gone — never compared again.`,
      })
    } else {
      for (let i = store; i <= hi; i++) if (!discarded.includes(i)) discarded.push(i)
      say('discard', `target is left of ${store} — discard ${hi - store + 1} elements`)
      hi = store - 1
      yield emit({
        phase: 'discard',
        lo,
        hi,
        pivot: store,
        codeLine: 6,
        description: `The answer sits left of index ${store}. That whole right side is discarded without sorting any of it.`,
      })
    }
  }
}
