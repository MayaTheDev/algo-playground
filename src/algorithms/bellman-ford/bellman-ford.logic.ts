export type BfNode = { id: string; x: number; y: number }
export type BfEdge = { from: string; to: string; weight: number }

export type BellmanFordStep = {
  nodes: BfNode[]
  edges: BfEdge[]
  distances: Record<string, number>
  predecessors: Record<string, string | null>
  /** 0 = setup, 1..V-1 = relaxation passes, V = negative-cycle detection pass */
  pass: number
  totalPasses: number
  /** Index into `edges` of the edge currently being examined */
  activeEdge: number | null
  /** Edges that produced an improvement during the current pass */
  improvedEdges: number[]
  /** Per-pass tally of how many edges improved — drives the "extra passes" strip */
  passImprovements: number[]
  phase:
    | 'init'
    | 'relax'
    | 'pass-summary'
    | 'detect'
    | 'contrast'
    | 'negative-cycle'
    | 'done'
  negativeCycle: boolean
  /** Dijkstra's answer on the same graph — only populated during the contrast phase */
  dijkstra: { distances: Record<string, number>; settled: string[] } | null
  description: string
}

const SOURCE = 'S'

const NODES: BfNode[] = [
  { id: 'S', x: 12, y: 50 },
  { id: 'A', x: 40, y: 20 },
  { id: 'B', x: 40, y: 80 },
  { id: 'C', x: 68, y: 20 },
  { id: 'D', x: 88, y: 55 },
]

/**
 * Edge order matters for Bellman-Ford's pace: this ordering deliberately needs
 * two full passes to converge, so the "extra pass" is visible rather than theoretical.
 */
const EDGES: BfEdge[] = [
  { from: 'S', to: 'A', weight: 4 },
  { from: 'S', to: 'B', weight: 5 },
  { from: 'A', to: 'C', weight: 3 },
  { from: 'B', to: 'A', weight: -3 },
  { from: 'B', to: 'D', weight: 4 },
  { from: 'C', to: 'D', weight: -2 },
]

/** The edge that turns B → D → B into a negative cycle in the final act */
const CYCLE_EDGE: BfEdge = { from: 'D', to: 'B', weight: -6 }

function fmt(d: number): string {
  return d === Infinity ? '∞' : String(d)
}

/** Dijkstra on the same graph — kept here purely to show where it goes wrong */
function runDijkstra(nodes: BfNode[], edges: BfEdge[], start: string) {
  const distances: Record<string, number> = {}
  for (const n of nodes) distances[n.id] = Infinity
  distances[start] = 0

  const settled: string[] = []
  const remaining = new Set(nodes.map((n) => n.id))

  while (remaining.size > 0) {
    let best: string | null = null
    for (const id of remaining) {
      if (best === null || distances[id] < distances[best]) best = id
    }
    if (best === null || distances[best] === Infinity) break

    remaining.delete(best)
    settled.push(best)

    for (const e of edges) {
      // The fatal assumption: a settled node is never reopened.
      if (e.from !== best || settled.includes(e.to)) continue
      const candidate = distances[best] + e.weight
      if (candidate < distances[e.to]) distances[e.to] = candidate
    }
  }

  return { distances, settled }
}

export function* bellmanFordSteps(): Generator<BellmanFordStep> {
  const nodes = NODES
  const edges = EDGES
  const totalPasses = nodes.length - 1

  const distances: Record<string, number> = {}
  const predecessors: Record<string, string | null> = {}
  for (const n of nodes) {
    distances[n.id] = Infinity
    predecessors[n.id] = null
  }
  distances[SOURCE] = 0

  const passImprovements: number[] = []

  const base = (
    overrides: Partial<BellmanFordStep> & { description: string },
  ): BellmanFordStep => ({
    nodes,
    edges,
    distances: { ...distances },
    predecessors: { ...predecessors },
    pass: 0,
    totalPasses,
    activeEdge: null,
    improvedEdges: [],
    passImprovements: [...passImprovements],
    phase: 'relax',
    negativeCycle: false,
    dijkstra: null,
    ...overrides,
  })

  yield base({
    phase: 'init',
    description:
      `Initialize every distance to ∞ except the source. ${SOURCE}=0. ` +
      'Bellman-Ford makes no assumption about which node is "done" — that is the whole difference.',
  })

  yield base({
    phase: 'init',
    description:
      'Note edge B→A has weight -3. A negative edge means taking a longer-looking route can lower the total cost. ' +
      "Dijkstra's cannot handle that, because it finalizes nodes in increasing distance order.",
  })

  // ── V-1 relaxation passes ───────────────────────────────────────────────────
  for (let pass = 1; pass <= totalPasses; pass++) {
    const improvedEdges: number[] = []

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i]
      const from = distances[e.from]
      const candidate = from === Infinity ? Infinity : from + e.weight
      const improves = candidate < distances[e.to]

      if (improves) {
        const before = distances[e.to]
        distances[e.to] = candidate
        predecessors[e.to] = e.from
        improvedEdges.push(i)

        yield base({
          pass,
          activeEdge: i,
          improvedEdges: [...improvedEdges],
          description:
            `Pass ${pass}/${totalPasses} · relax ${e.from}→${e.to} (w=${e.weight}): ` +
            `${fmt(before)} → ${candidate}. Improvement found.`,
        })
      } else {
        yield base({
          pass,
          activeEdge: i,
          improvedEdges: [...improvedEdges],
          description:
            `Pass ${pass}/${totalPasses} · check ${e.from}→${e.to} (w=${e.weight}): ` +
            `${fmt(from)}${from === Infinity ? '' : ` + ${e.weight}`} is not better than ` +
            `${fmt(distances[e.to])}. No change.`,
        })
      }
    }

    passImprovements.push(improvedEdges.length)

    yield base({
      pass,
      phase: 'pass-summary',
      improvedEdges: [...improvedEdges],
      description:
        improvedEdges.length > 0
          ? `Pass ${pass} finished: ${improvedEdges.length} edge${improvedEdges.length === 1 ? '' : 's'} improved. ` +
            'Anything that changed may unlock a further improvement downstream, so we run the next pass.'
          : `Pass ${pass} finished: nothing changed. The distances are stable — but Bellman-Ford still ` +
            `runs its remaining passes rather than assume. That is the cost of not guessing.`,
    })
  }

  yield base({
    pass: totalPasses,
    phase: 'pass-summary',
    description:
      `${totalPasses} passes done — one fewer than the node count, because any shortest path in a graph ` +
      `with ${nodes.length} nodes uses at most ${totalPasses} edges. ` +
      `O(V × E) = ${nodes.length} × ${edges.length}. Slower than Dijkstra. Correct on this graph.`,
  })

  // ── Negative-cycle detection pass ───────────────────────────────────────────
  yield base({
    pass: totalPasses + 1,
    phase: 'detect',
    description:
      'One more pass — the detection pass. If any edge can still be relaxed after V-1 passes, ' +
      'the graph contains a negative cycle and "shortest path" has no answer.',
  })

  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]
    const from = distances[e.from]
    const candidate = from === Infinity ? Infinity : from + e.weight
    yield base({
      pass: totalPasses + 1,
      phase: 'detect',
      activeEdge: i,
      description:
        `Detection · ${e.from}→${e.to} (w=${e.weight}): ${fmt(candidate)} vs ${fmt(distances[e.to])} — ` +
        `${candidate < distances[e.to] ? 'still improving!' : 'stable.'}`,
    })
  }

  yield base({
    pass: totalPasses + 1,
    phase: 'detect',
    description:
      'No edge improved on the detection pass. No negative cycle. ' +
      `Final distances: ${nodes.map((n) => `${n.id}=${fmt(distances[n.id])}`).join(', ')}.`,
  })

  // ── Contrast with Dijkstra ──────────────────────────────────────────────────
  const dij = runDijkstra(nodes, edges, SOURCE)
  const wrong = nodes
    .filter((n) => dij.distances[n.id] !== distances[n.id])
    .map((n) => n.id)

  yield base({
    pass: totalPasses + 1,
    phase: 'contrast',
    dijkstra: dij,
    description:
      `Now run Dijkstra's on the same graph. It settles nodes in order ${dij.settled.join(' → ')} ` +
      'and never reopens a settled node.',
  })

  yield base({
    pass: totalPasses + 1,
    phase: 'contrast',
    dijkstra: dij,
    description:
      `Dijkstra settles A at 4 before it ever looks at B→A (-3). By the time that edge is examined, ` +
      `A is closed. The improvement to 2 is discarded, and every path through A inherits the error: ` +
      `${wrong.join(', ')} come out wrong.`,
  })

  yield base({
    pass: totalPasses + 1,
    phase: 'contrast',
    dijkstra: dij,
    description:
      "Bellman-Ford is slower — it re-checks every edge, every pass, including passes that change nothing. " +
      'It is also right. It assumes nothing is settled until the arithmetic says so.',
  })

  // ── Final act: introduce a negative cycle ───────────────────────────────────
  const cycleEdges = [...edges, CYCLE_EDGE]
  const cycleIdx = cycleEdges.length - 1

  const cycleBase = (
    overrides: Partial<BellmanFordStep> & { description: string },
  ): BellmanFordStep => ({
    ...base({ description: '' }),
    edges: cycleEdges,
    pass: totalPasses + 1,
    phase: 'negative-cycle',
    negativeCycle: true,
    ...overrides,
  })

  yield cycleBase({
    negativeCycle: false,
    description:
      `Add one edge: ${CYCLE_EDGE.from}→${CYCLE_EDGE.to} with weight ${CYCLE_EDGE.weight}. ` +
      `Now B→D (4) → B (${CYCLE_EDGE.weight}) is a loop with total cost ${4 + CYCLE_EDGE.weight}.`,
  })

  yield cycleBase({
    activeEdge: cycleIdx,
    negativeCycle: false,
    description:
      `Detection pass again · ${CYCLE_EDGE.from}→${CYCLE_EDGE.to}: ` +
      `${fmt(distances[CYCLE_EDGE.from])} + (${CYCLE_EDGE.weight}) = ` +
      `${fmt(distances[CYCLE_EDGE.from] + CYCLE_EDGE.weight)}, better than ${fmt(distances[CYCLE_EDGE.to])}.`,
  })

  yield cycleBase({
    activeEdge: cycleIdx,
    description:
      'An improvement after V-1 passes means you can keep going around the loop forever, ' +
      'lowering the total each time. Negative cycle detected — there is no shortest path to report.',
  })

  yield cycleBase({
    phase: 'done',
    description:
      "Dijkstra's would have returned a confident number here. Bellman-Ford returns \"this question has no answer.\" " +
      'The extra pass is not overhead — it is the part that can tell you the problem itself is broken.',
  })
}
