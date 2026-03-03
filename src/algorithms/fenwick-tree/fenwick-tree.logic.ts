export type FenwickStep = {
  original: number[]
  tree: number[]
  phase: 'build' | 'query' | 'update'
  activeIndex: number | null
  visitedIndices: number[]
  queryResult: number | null
  binaryRepr: string | null
  description: string
}

// Return lowest set bit of i (i & -i)
function lsb(i: number): number {
  return i & -i
}

function toBinary(n: number, bits = 4): string {
  return n.toString(2).padStart(bits, '0')
}

export function* fenwickTreeSteps(): Generator<FenwickStep> {
  const original = [3, 2, 5, 1, 4, 7, 2, 6]
  const n = original.length

  // BIT is 1-indexed; index 0 is unused
  const tree = new Array(n + 1).fill(0)

  // ── Phase 1: Build ──────────────────────────────────────────────────────────
  yield {
    original,
    tree: [...tree],
    phase: 'build',
    activeIndex: null,
    visitedIndices: [],
    queryResult: null,
    binaryRepr: null,
    description:
      'Build phase: each BIT cell tree[i] stores the sum of a range determined by the lowest set bit of i. We insert each element one by one.',
  }

  for (let i = 1; i <= n; i++) {
    const val = original[i - 1]
    const path: number[] = []

    yield {
      original,
      tree: [...tree],
      phase: 'build',
      activeIndex: i,
      visitedIndices: [],
      queryResult: null,
      binaryRepr: toBinary(i),
      description: `Inserting original[${i - 1}] = ${val} at BIT index ${i} (binary: ${toBinary(i)}). Will propagate up by adding lsb(i) = ${lsb(i)}.`,
    }

    let j = i
    while (j <= n) {
      tree[j] += val
      path.push(j)

      yield {
        original,
        tree: [...tree],
        phase: 'build',
        activeIndex: j,
        visitedIndices: [...path],
        queryResult: null,
        binaryRepr: toBinary(j),
        description: `tree[${j}] += ${val} → tree[${j}] = ${tree[j]}. Next: ${j} + lsb(${j}) = ${j} + ${lsb(j)} = ${j + lsb(j)}${j + lsb(j) > n ? ' (out of range, stop)' : ''}.`,
      }

      j += lsb(j)
    }
  }

  yield {
    original,
    tree: [...tree],
    phase: 'build',
    activeIndex: null,
    visitedIndices: [],
    queryResult: null,
    binaryRepr: null,
    description: `Build complete. The BIT now stores partial sums. tree[4] = ${tree[4]} covers indices 1–4 (sum of first 4 elements).`,
  }

  // ── Phase 2: Prefix sum query (query index 6, i.e. sum of first 6 elements) ──
  const queryIdx = 6
  const expectedPrefixSum = original.slice(0, queryIdx).reduce((a, b) => a + b, 0)

  yield {
    original,
    tree: [...tree],
    phase: 'query',
    activeIndex: queryIdx,
    visitedIndices: [],
    queryResult: null,
    binaryRepr: toBinary(queryIdx),
    description: `Query phase: compute prefix sum up to index ${queryIdx} (sum of original[0..${queryIdx - 1}] = ${expectedPrefixSum}). We walk backward by stripping the lowest set bit.`,
  }

  let querySum = 0
  const queryPath: number[] = []
  let qi = queryIdx

  while (qi > 0) {
    querySum += tree[qi]
    queryPath.push(qi)

    yield {
      original,
      tree: [...tree],
      phase: 'query',
      activeIndex: qi,
      visitedIndices: [...queryPath],
      queryResult: querySum,
      binaryRepr: toBinary(qi),
      description: `Add tree[${qi}] = ${tree[qi]} → running sum = ${querySum}. Strip lsb(${qi}) = ${lsb(qi)}: next index = ${qi} - ${lsb(qi)} = ${qi - lsb(qi)}${qi - lsb(qi) === 0 ? ' (done)' : ''}.`,
    }

    qi -= lsb(qi)
  }

  yield {
    original,
    tree: [...tree],
    phase: 'query',
    activeIndex: null,
    visitedIndices: [...queryPath],
    queryResult: querySum,
    binaryRepr: null,
    description: `Prefix sum query(${queryIdx}) = ${querySum}. Verified: ${original.slice(0, queryIdx).join(' + ')} = ${expectedPrefixSum}. Only ${queryPath.length} steps instead of ${queryIdx}!`,
  }

  // ── Phase 3: Point update (add +3 to original[2], i.e. BIT index 3) ─────────
  const updateIdx = 3
  const delta = 3

  yield {
    original,
    tree: [...tree],
    phase: 'update',
    activeIndex: updateIdx,
    visitedIndices: [],
    queryResult: null,
    binaryRepr: toBinary(updateIdx),
    description: `Update phase: add delta = ${delta} to position ${updateIdx} (original[${updateIdx - 1}]). Walk forward by adding lsb(i) to propagate the change to all covering cells.`,
  }

  const updatePath: number[] = []
  let ui = updateIdx

  while (ui <= n) {
    tree[ui] += delta
    updatePath.push(ui)

    yield {
      original,
      tree: [...tree],
      phase: 'update',
      activeIndex: ui,
      visitedIndices: [...updatePath],
      queryResult: null,
      binaryRepr: toBinary(ui),
      description: `tree[${ui}] += ${delta} → tree[${ui}] = ${tree[ui]}. lsb(${ui}) = ${lsb(ui)}, next = ${ui + lsb(ui)}${ui + lsb(ui) > n ? ' (out of range, done)' : ''}.`,
    }

    ui += lsb(ui)
  }

  // Update the original array to reflect the change
  const updatedOriginal = [...original]
  updatedOriginal[updateIdx - 1] += delta

  yield {
    original: updatedOriginal,
    tree: [...tree],
    phase: 'update',
    activeIndex: null,
    visitedIndices: [...updatePath],
    queryResult: null,
    binaryRepr: null,
    description: `Update complete. ${updatePath.length} cells updated in O(log n). original[${updateIdx - 1}] is now ${updatedOriginal[updateIdx - 1]}.`,
  }

  // ── Phase 4: Range query [3, 6] using two prefix sums ─────────────────────
  const rangeL = 3
  const rangeR = 6
  const trueRangeSum = updatedOriginal.slice(rangeL - 1, rangeR).reduce((a, b) => a + b, 0)

  yield {
    original: updatedOriginal,
    tree: [...tree],
    phase: 'query',
    activeIndex: null,
    visitedIndices: [],
    queryResult: null,
    binaryRepr: null,
    description: `Range query [${rangeL}, ${rangeR}]: use prefix(${rangeR}) − prefix(${rangeL - 1}). The BIT handles range sums with just two prefix queries.`,
  }

  // Compute prefix(rangeR)
  let sumR = 0
  const pathR: number[] = []
  let ri = rangeR
  while (ri > 0) {
    sumR += tree[ri]
    pathR.push(ri)
    ri -= lsb(ri)
  }

  yield {
    original: updatedOriginal,
    tree: [...tree],
    phase: 'query',
    activeIndex: rangeR,
    visitedIndices: [...pathR],
    queryResult: sumR,
    binaryRepr: toBinary(rangeR),
    description: `prefix(${rangeR}) = ${sumR} (visited cells: ${pathR.join(' → ')}).`,
  }

  // Compute prefix(rangeL - 1)
  let sumL = 0
  const pathL: number[] = []
  let li = rangeL - 1
  while (li > 0) {
    sumL += tree[li]
    pathL.push(li)
    li -= lsb(li)
  }

  yield {
    original: updatedOriginal,
    tree: [...tree],
    phase: 'query',
    activeIndex: rangeL - 1,
    visitedIndices: [...pathL],
    queryResult: sumL,
    binaryRepr: toBinary(rangeL - 1),
    description: `prefix(${rangeL - 1}) = ${sumL} (visited cells: ${pathL.length > 0 ? pathL.join(' → ') : 'none (prefix of 0 = 0)'}).`,
  }

  const rangeSum = sumR - sumL

  yield {
    original: updatedOriginal,
    tree: [...tree],
    phase: 'query',
    activeIndex: null,
    visitedIndices: [],
    queryResult: rangeSum,
    binaryRepr: null,
    description: `Range sum [${rangeL}, ${rangeR}] = prefix(${rangeR}) − prefix(${rangeL - 1}) = ${sumR} − ${sumL} = ${rangeSum}. Verified: ${updatedOriginal.slice(rangeL - 1, rangeR).join(' + ')} = ${trueRangeSum}.`,
  }
}
