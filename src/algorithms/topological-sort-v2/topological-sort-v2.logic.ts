/**
 * Topological sort v2 — Day 57.
 *
 * Day 28 ran Kahn's algorithm on a graph that happened to be acyclic, so it
 * never had to answer the harder question: what does this algorithm do when
 * the graph is wrong?
 *
 * The answer is the uncomfortable part. Nothing throws. No node is visited
 * twice, no index goes out of range, no assertion fires. The queue simply
 * empties earlier than it should and you get back an ordering that is *short*.
 * The only thing standing between that and a corrupted deploy is one line:
 *
 *     if len(order) != len(nodes): raise CycleError
 *
 * A failure mode that only shows up as a length mismatch is a failure mode you
 * have to go looking for.
 */

export type TopoV2Node = {
  id: string
  /** what the task actually is, so the cycle reads like a real dependency bug */
  label: string
  x: number
  y: number
}

export type TopoV2Edge = {
  from: string
  to: string
  /** optional edges are the ones the viewer can switch on */
  optional?: boolean
}

export type OptionalEdge = {
  id: string
  from: string
  to: string
  label: string
  /** whether adding this edge closes a cycle */
  createsCycle: boolean
  blurb: string
}

export type TopoV2Phase =
  | 'init'
  | 'dequeue'
  | 'decrement'
  | 'enqueue'
  | 'drain'
  | 'check'
  | 'cycle'

export type TopoV2Step = {
  nodes: TopoV2Node[]
  edges: TopoV2Edge[]
  /** live in-degree — how many dependencies each node is still waiting on */
  inDegree: Record<string, number>
  /** in-degree before the loop started, for the before/after column */
  initialInDegree: Record<string, number>
  /** unsatisfied dependencies per node, by id */
  waitingOn: Record<string, string[]>
  queue: string[]
  order: string[]
  current: string | null
  reducedEdge: [string, string] | null
  /** edges already consumed by a dequeue */
  consumedEdges: string[]
  phase: TopoV2Phase
  /** the length check, once it runs */
  check: { orderLength: number; nodeCount: number; passed: boolean } | null
  /** nodes the queue never reached */
  stuck: string[]
  /** the cycle recovered from what is left over */
  cycle: string[] | null
  description: string
}

// ─── The pipeline ────────────────────────────────────────────────────────────

export const NODES: TopoV2Node[] = [
  { id: 'schema', label: 'migrate schema', x: 10, y: 48 },
  { id: 'api', label: 'build api', x: 30, y: 22 },
  { id: 'seed', label: 'seed fixtures', x: 30, y: 76 },
  { id: 'web', label: 'build web', x: 52, y: 12 },
  { id: 'e2e', label: 'e2e suite', x: 52, y: 54 },
  { id: 'deploy', label: 'deploy', x: 74, y: 30 },
  { id: 'smoke', label: 'smoke test', x: 90, y: 66 },
]

export const BASE_EDGES: TopoV2Edge[] = [
  { from: 'schema', to: 'api' },
  { from: 'schema', to: 'seed' },
  { from: 'api', to: 'web' },
  { from: 'api', to: 'e2e' },
  { from: 'seed', to: 'e2e' },
  { from: 'web', to: 'deploy' },
  { from: 'e2e', to: 'deploy' },
  { from: 'deploy', to: 'smoke' },
]

/**
 * Edges a viewer can add. Two of them close a loop; one does not. From inside
 * the algorithm they are indistinguishable — each one is just an increment.
 */
export const OPTIONAL_EDGES: OptionalEdge[] = [
  {
    id: 'seed-web',
    from: 'seed',
    to: 'web',
    label: 'seed → web',
    createsCycle: false,
    blurb: 'web waits for fixtures too. Still a DAG — the order just gets tighter.',
  },
  {
    id: 'e2e-api',
    from: 'e2e',
    to: 'api',
    label: 'e2e → api',
    createsCycle: true,
    blurb: 'the api build starts consuming a snapshot the e2e suite produces. Two nodes, each waiting on the other.',
  },
  {
    id: 'smoke-schema',
    from: 'smoke',
    to: 'schema',
    label: 'smoke → schema',
    createsCycle: true,
    blurb: 'the migration picks up a flag the smoke test writes. Five hops away, nobody sees it in review.',
  },
]

export function edgeKey(from: string, to: string): string {
  return `${from}->${to}`
}

export function buildEdges(enabled: string[]): TopoV2Edge[] {
  const extra = OPTIONAL_EDGES.filter(e => enabled.includes(e.id)).map(e => ({
    from: e.from,
    to: e.to,
    optional: true,
  }))
  return [...BASE_EDGES, ...extra]
}

export function nodeLabel(id: string): string {
  return NODES.find(n => n.id === id)?.label ?? id
}

// ─── The reference implementation, as text ───────────────────────────────────

export const CODE_LINES = [
  'indeg = {n: 0 for n in nodes}',
  'for (u, v) in edges:',
  '    indeg[v] += 1',
  '',
  'queue = [n for n in nodes if indeg[n] == 0]',
  'order = []',
  '',
  'while queue:',
  '    u = queue.pop(0)',
  '    order.append(u)',
  '    for v in adj[u]:',
  '        indeg[v] -= 1',
  '        if indeg[v] == 0:',
  '            queue.append(v)',
  '',
  'if len(order) != len(nodes):',
  '    raise CycleError(remaining(indeg))',
  'return order',
]

/** The lines that matter for each phase — used to light up the code panel. */
export const PHASE_LINES: Record<TopoV2Phase, number[]> = {
  init: [0, 1, 2, 4, 5],
  dequeue: [8, 9],
  decrement: [10, 11],
  enqueue: [12, 13],
  drain: [7],
  check: [15],
  cycle: [15, 16],
}

// ─── Cycle recovery ──────────────────────────────────────────────────────────

/**
 * Whatever the queue could not reach is, by definition, waiting on something
 * that is also waiting. Walk it until a node repeats and that walk is a cycle.
 */
function findCycle(stuck: string[], edges: TopoV2Edge[]): string[] | null {
  if (stuck.length === 0) return null
  const inStuck = new Set(stuck)
  const adj = new Map<string, string[]>()
  for (const e of edges) {
    if (!inStuck.has(e.from) || !inStuck.has(e.to)) continue
    adj.set(e.from, [...(adj.get(e.from) ?? []), e.to])
  }

  // A stuck node is not necessarily *on* the cycle — it may just be downstream
  // of one. Depth-first search until the walk meets its own stack.
  const VISITING = 1
  const DONE = 2
  const state = new Map<string, number>()
  const stack: string[] = []
  let cycle: string[] | null = null

  function visit(id: string): boolean {
    state.set(id, VISITING)
    stack.push(id)
    for (const next of adj.get(id) ?? []) {
      if (state.get(next) === VISITING) {
        cycle = [...stack.slice(stack.indexOf(next)), next]
        return true
      }
      if (state.get(next) === undefined && visit(next)) return true
    }
    stack.pop()
    state.set(id, DONE)
    return false
  }

  for (const id of stuck) {
    if (state.get(id) === undefined && visit(id)) break
  }
  return cycle
}

// ─── Step generator ──────────────────────────────────────────────────────────

export function* topologicalSortV2Steps(enabled: string[]): Generator<TopoV2Step> {
  const edges = buildEdges(enabled)
  const nodeIds = NODES.map(n => n.id)

  const inDegree: Record<string, number> = {}
  for (const id of nodeIds) inDegree[id] = 0
  for (const e of edges) inDegree[e.to]++
  const initialInDegree = { ...inDegree }

  const waitingOn: Record<string, string[]> = {}
  for (const id of nodeIds) {
    waitingOn[id] = edges.filter(e => e.to === id).map(e => e.from)
  }

  const queue: string[] = nodeIds.filter(id => inDegree[id] === 0)
  const order: string[] = []
  const consumedEdges: string[] = []

  function snapshot(
    phase: TopoV2Phase,
    description: string,
    extra: Partial<TopoV2Step> = {},
  ): TopoV2Step {
    return {
      nodes: NODES,
      edges,
      inDegree: { ...inDegree },
      initialInDegree,
      waitingOn: Object.fromEntries(Object.entries(waitingOn).map(([k, v]) => [k, [...v]])),
      queue: [...queue],
      order: [...order],
      current: null,
      reducedEdge: null,
      consumedEdges: [...consumedEdges],
      phase,
      check: null,
      stuck: [],
      cycle: null,
      description,
      ...extra,
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  yield snapshot(
    'init',
    `Count dependencies. In-degree is the number of edges pointing *at* a node — how many things it is still waiting on. ` +
      `${queue.length} node${queue.length === 1 ? '' : 's'} start at zero: [${queue.join(', ')}].`,
  )

  if (queue.length === 0) {
    yield snapshot(
      'drain',
      'Every node has an in-degree above zero, so the queue starts empty and the loop body never runs. ' +
        'The function still returns — with nothing in it.',
    )
  }

  // ── Main loop ──────────────────────────────────────────────────────────────

  while (queue.length > 0) {
    const current = queue.shift()!
    order.push(current)

    yield snapshot('dequeue', `Take ${current} — in-degree 0, nothing left blocking it. Emit it. Order is now ${order.length}/${nodeIds.length}.`, {
      current,
    })

    for (const edge of edges) {
      if (edge.from !== current) continue
      inDegree[edge.to]--
      waitingOn[edge.to] = waitingOn[edge.to].filter(dep => dep !== current)
      consumedEdges.push(edgeKey(edge.from, edge.to))

      yield snapshot(
        'decrement',
        `${current} is done, so ${edge.to} is waiting on one fewer thing: in-degree[${edge.to}] = ${inDegree[edge.to]}` +
          (waitingOn[edge.to].length > 0 ? `, still blocked by ${waitingOn[edge.to].join(', ')}.` : '.'),
        { current, reducedEdge: [edge.from, edge.to] },
      )

      if (inDegree[edge.to] === 0) {
        queue.push(edge.to)
        yield snapshot(
          'enqueue',
          `${edge.to} hit zero — every dependency has been emitted. Queue: [${queue.join(', ')}].`,
          { current },
        )
      }
    }
  }

  // ── The quiet part ─────────────────────────────────────────────────────────

  const stuck = nodeIds.filter(id => !order.includes(id))
  const complete = order.length === nodeIds.length

  yield snapshot(
    'drain',
    complete
      ? `Queue empty. ${order.length} of ${nodeIds.length} nodes emitted: ${order.join(' → ')}.`
      : order.length === 0
        ? 'Queue empty. No error, no exception, no warning — the loop never ran at all. ' +
          'The function is about to return an empty list, and an empty list is a perfectly valid ordering of zero tasks.'
        : 'Queue empty. No error, no exception, no warning — the loop just ran out of work. ' +
          `The function is holding a well-formed list: ${order.join(' → ')}. It looks like an answer.`,
    { stuck },
  )

  // ── The one line that catches it ───────────────────────────────────────────

  yield snapshot(
    'check',
    complete
      ? `len(order) == len(nodes) → ${order.length} == ${nodeIds.length}. The ordering is complete, so the graph was acyclic.`
      : `len(order) != len(nodes) → ${order.length} != ${nodeIds.length}. This comparison is the entire cycle detector. ` +
        `Delete it and the pipeline runs ${order.length} of ${nodeIds.length} steps and reports success.`,
    { stuck, check: { orderLength: order.length, nodeCount: nodeIds.length, passed: complete } },
  )

  if (!complete) {
    const cycle = findCycle(stuck, edges)
    yield snapshot(
      'cycle',
      cycle
        ? `The ${stuck.length} nodes the queue never reached are all waiting on each other: ` +
          `${cycle.join(' → ')}. Nobody's in-degree can ever reach zero, so nobody is ever emitted.`
        : `${stuck.length} nodes never reached in-degree zero: ${stuck.join(', ')}.`,
      { stuck, cycle, check: { orderLength: order.length, nodeCount: nodeIds.length, passed: false } },
    )
  }
}

// ─── Summary, for the edge toggles ───────────────────────────────────────────

export type RunSummary = {
  emitted: number
  total: number
  complete: boolean
  stuck: string[]
}

export function summarizeRun(enabled: string[]): RunSummary {
  let last: TopoV2Step | null = null
  for (const step of topologicalSortV2Steps(enabled)) last = step
  const emitted = last?.order.length ?? 0
  return {
    emitted,
    total: NODES.length,
    complete: emitted === NODES.length,
    stuck: last?.stuck ?? [],
  }
}
