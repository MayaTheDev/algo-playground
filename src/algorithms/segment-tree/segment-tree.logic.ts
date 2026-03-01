export type SegmentTreeStep = {
  tree: number[]
  array: number[]
  queryRange: [number, number] | null
  activeNodes: number[]
  result: number | null
  phase: 'build' | 'query' | 'update'
  description: string
}

const INPUT = [2, 5, 1, 4, 9, 3]
const N = INPUT.length

// Segment tree size: 4 * N is a safe upper bound
// tree[1] is root (1-indexed). For node i: left = 2i, right = 2i+1
// Node i covers range [l, r]. Leaf nodes cover single elements.

function buildTree(arr: number[]): number[] {
  const size = 4 * arr.length
  const tree = new Array(size).fill(0)

  function build(node: number, l: number, r: number) {
    if (l === r) {
      tree[node] = arr[l]
      return
    }
    const mid = Math.floor((l + r) / 2)
    build(2 * node, l, mid)
    build(2 * node + 1, mid + 1, r)
    tree[node] = Math.min(tree[2 * node], tree[2 * node + 1])
  }

  build(1, 0, arr.length - 1)
  return tree
}

export function* segmentTreeSteps(): Generator<SegmentTreeStep> {
  const array = [...INPUT]
  const tree = new Array(4 * N).fill(0)

  // ─── Phase 1: Build ───────────────────────────────────────────────────────

  yield {
    tree: [...tree],
    array: [...array],
    queryRange: null,
    activeNodes: [],
    result: null,
    phase: 'build',
    description: `Build a segment tree for range minimum queries on [${INPUT.join(', ')}]. Each internal node stores the min of its range.`,
  }

  // We'll replay the build step-by-step, yielding each node as it's filled.
  // Collect (node, l, r) pairs in post-order to show bottom-up filling.
  type BuildEntry = { node: number; l: number; r: number }
  const buildOrder: BuildEntry[] = []

  function collectBuildOrder(node: number, l: number, r: number) {
    if (l === r) {
      buildOrder.push({ node, l, r })
      return
    }
    const mid = Math.floor((l + r) / 2)
    collectBuildOrder(2 * node, l, mid)
    collectBuildOrder(2 * node + 1, mid + 1, r)
    buildOrder.push({ node, l, r })
  }
  collectBuildOrder(1, 0, N - 1)

  // Pre-build the full tree for value lookups
  const fullTree = buildTree(array)

  for (const { node, l, r } of buildOrder) {
    tree[node] = fullTree[node]

    if (l === r) {
      yield {
        tree: [...tree],
        array: [...array],
        queryRange: null,
        activeNodes: [node],
        result: null,
        phase: 'build',
        description: `Leaf node ${node}: covers index ${l}, value = ${array[l]}.`,
      }
    } else {
      const mid = Math.floor((l + r) / 2)
      yield {
        tree: [...tree],
        array: [...array],
        queryRange: null,
        activeNodes: [node, 2 * node, 2 * node + 1],
        result: null,
        phase: 'build',
        description: `Node ${node}: covers [${l}..${r}]. min(left=${tree[2 * node]}, right=${tree[2 * node + 1]}) = ${tree[node]}. Split at mid=${mid}.`,
      }
    }
  }

  yield {
    tree: [...tree],
    array: [...array],
    queryRange: null,
    activeNodes: [1],
    result: tree[1],
    phase: 'build',
    description: `Build complete. Root node holds global min = ${tree[1]} over the entire array [0..${N - 1}].`,
  }

  // ─── Phase 2: Query range min [1, 4] ─────────────────────────────────────

  const qL = 1
  const qR = 4

  yield {
    tree: [...tree],
    array: [...array],
    queryRange: [qL, qR],
    activeNodes: [],
    result: null,
    phase: 'query',
    description: `Query: range minimum of array[${qL}..${qR}]. Walk the tree top-down, pruning branches outside the range.`,
  }

  // Step through query traversal, yielding each visited node
  const queryVisited: number[] = []

  function* queryGen(node: number, l: number, r: number): Generator<SegmentTreeStep> {
    queryVisited.push(node)

    if (r < qL || l > qR) {
      yield {
        tree: [...tree],
        array: [...array],
        queryRange: [qL, qR],
        activeNodes: [...queryVisited],
        result: null,
        phase: 'query',
        description: `Node ${node} [${l}..${r}]: fully outside [${qL}..${qR}]. Return ∞ (skip).`,
      }
      queryVisited.pop()
      return
    }

    if (l >= qL && r <= qR) {
      yield {
        tree: [...tree],
        array: [...array],
        queryRange: [qL, qR],
        activeNodes: [...queryVisited],
        result: tree[node],
        phase: 'query',
        description: `Node ${node} [${l}..${r}]: fully inside [${qL}..${qR}]. Return stored min = ${tree[node]}.`,
      }
      queryVisited.pop()
      return
    }

    const mid = Math.floor((l + r) / 2)
    yield {
      tree: [...tree],
      array: [...array],
      queryRange: [qL, qR],
      activeNodes: [...queryVisited],
      result: null,
      phase: 'query',
      description: `Node ${node} [${l}..${r}]: partially overlaps [${qL}..${qR}]. Split at mid=${mid} and recurse both children.`,
    }

    yield* queryGen(2 * node, l, mid)
    yield* queryGen(2 * node + 1, mid + 1, r)
    queryVisited.pop()
  }

  yield* queryGen(1, 0, N - 1)

  const queryResult = Math.min(...array.slice(qL, qR + 1))
  yield {
    tree: [...tree],
    array: [...array],
    queryRange: [qL, qR],
    activeNodes: [1],
    result: queryResult,
    phase: 'query',
    description: `Query complete. Minimum of array[${qL}..${qR}] = ${queryResult}. Only O(log n) nodes were visited.`,
  }

  // ─── Phase 3: Point update index 2 → value 0 ─────────────────────────────

  const updateIdx = 2
  const newVal = 0

  yield {
    tree: [...tree],
    array: [...array],
    queryRange: null,
    activeNodes: [],
    result: null,
    phase: 'update',
    description: `Update: set array[${updateIdx}] = ${newVal} (was ${array[updateIdx]}). Propagate change up to the root.`,
  }

  array[updateIdx] = newVal

  // Collect the path from root to the updated leaf
  const updatePath: number[] = []

  function collectUpdatePath(node: number, l: number, r: number) {
    updatePath.push(node)
    if (l === r) return
    const mid = Math.floor((l + r) / 2)
    if (updateIdx <= mid) collectUpdatePath(2 * node, l, mid)
    else collectUpdatePath(2 * node + 1, mid + 1, r)
  }
  collectUpdatePath(1, 0, N - 1)

  // Yield going down the path
  yield {
    tree: [...tree],
    array: [...array],
    queryRange: null,
    activeNodes: [...updatePath],
    result: null,
    phase: 'update',
    description: `Walk down to the leaf for index ${updateIdx}: path = [${updatePath.join(' → ')}].`,
  }

  // Update leaf first, then propagate up
  const leafNode = updatePath[updatePath.length - 1]
  tree[leafNode] = newVal

  yield {
    tree: [...tree],
    array: [...array],
    queryRange: null,
    activeNodes: [leafNode],
    result: null,
    phase: 'update',
    description: `Set leaf node ${leafNode} value to ${newVal}. Now propagate min values back up to the root.`,
  }

  // Propagate up
  for (let i = updatePath.length - 2; i >= 0; i--) {
    const node = updatePath[i]
    tree[node] = Math.min(tree[2 * node], tree[2 * node + 1])
    yield {
      tree: [...tree],
      array: [...array],
      queryRange: null,
      activeNodes: [node, 2 * node, 2 * node + 1],
      result: tree[node],
      phase: 'update',
      description: `Node ${node}: recompute min(${tree[2 * node]}, ${tree[2 * node + 1]}) = ${tree[node]}.`,
    }
  }

  yield {
    tree: [...tree],
    array: [...array],
    queryRange: null,
    activeNodes: [1],
    result: tree[1],
    phase: 'update',
    description: `Update complete. New global min = ${tree[1]}. Only O(log n) nodes were updated — the power of the segment tree.`,
  }
}
