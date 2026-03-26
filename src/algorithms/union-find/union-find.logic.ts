/**
 * Union-Find (disjoint sets) — Day 66.
 *
 * The structure answers one question: are these two things in the same group?
 *
 * It never stores the groups. It stores a parent pointer per element, and to
 * ask which group you're in it walks upward until it hits something that points
 * at itself. That element is the representative — and the representative is
 * arbitrary. It isn't the most important member. It's whichever one the merges
 * happened to leave at the top.
 *
 * Three runs of the same sequence of unions:
 *   naive      — find walks the whole chain, every time
 *   ranked     — union by rank keeps the tree shallow
 *   compressed — path compression flattens what's left on the way back
 */

export type UnionFindMode = 'naive' | 'ranked' | 'compressed'

export const N = 10

export type Node = {
  id: number
  parent: number
  rank: number
  /** depth below this node, recomputed for display */
  depth: number
}

export type LogKind = 'union' | 'find' | 'compress' | 'merge' | 'note'

export type LogLine = {
  kind: LogKind
  text: string
}

export type Verdict = {
  label: string
  steps: string
  depth: string
  note: string
}

export type UnionFindStep = {
  mode: UnionFindMode
  nodes: Node[]
  /** nodes touched by the current operation */
  active: number[]
  /** the path find() is currently walking */
  path: number[]
  /** the pair being unioned */
  pair: [number, number] | null
  /** index into CODE[mode] currently executing */
  codeLine: number | null
  /** pointer hops taken by this operation */
  hops: number
  /** cumulative pointer hops */
  totalHops: number
  /** deepest chain in the forest right now */
  maxDepth: number
  verdict: Verdict | null
  log: LogLine[]
  phase: 'setup' | 'union' | 'find' | 'compress' | 'verdict'
  description: string
}

export const MODE_LABELS: Record<UnionFindMode, string> = {
  naive: 'Naive',
  ranked: 'Union by rank',
  compressed: 'Path compression',
}

export const CODE: Record<UnionFindMode, string[]> = {
  naive: [
    'function find(x) {',
    '  while (parent[x] !== x) {',
    '    x = parent[x]          // one hop',
    '  }',
    '  return x                 // the representative',
    '}',
    '',
    'function union(a, b) {',
    '  parent[find(b)] = find(a)  // attach b under a, always',
    '  // no check on which is taller.',
    '}',
  ],
  ranked: [
    'function union(a, b) {',
    '  const ra = find(a), rb = find(b)',
    '  if (ra === rb) return',
    '  if (rank[ra] < rank[rb]) {',
    '    parent[ra] = rb        // shorter under taller',
    '  } else if (rank[ra] > rank[rb]) {',
    '    parent[rb] = ra',
    '  } else {',
    '    parent[rb] = ra; rank[ra]++',
    '  }',
    '}',
  ],
  compressed: [
    'function find(x) {',
    '  if (parent[x] !== x) {',
    '    parent[x] = find(parent[x])',
    '    // every node on the path now',
    '    // points straight at the root',
    '  }',
    '  return parent[x]',
    '}',
    '',
    '// the structure learns from being asked.',
  ],
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function freshNodes(): Node[] {
  return Array.from({ length: N }, (_, i) => ({ id: i, parent: i, rank: 0, depth: 0 }))
}

const clone = (nodes: Node[]): Node[] => nodes.map(n => ({ ...n }))

function chainDepth(nodes: Node[], i: number): number {
  let d = 0
  let cur = i
  while (nodes[cur].parent !== cur) {
    cur = nodes[cur].parent
    d++
    if (d > N) break
  }
  return d
}

function recomputeDepths(nodes: Node[]) {
  for (const n of nodes) n.depth = chainDepth(nodes, n.id)
}

function maxDepthOf(nodes: Node[]): number {
  return Math.max(...nodes.map(n => chainDepth(nodes, n.id)))
}

/** the same union sequence for all three modes, so the comparison is honest */
const UNIONS: [number, number][] = [
  [1, 0],
  [2, 1],
  [3, 2],
  [4, 3],
  [6, 5],
  [7, 6],
  [8, 7],
  [9, 8],
  [4, 9],
]

/** queries run after the unions — the two deepest nodes, each asked twice,
 *  so the second ask shows what compression bought */
const QUERIES: number[] = [0, 5, 0, 5]

// ─── generator ───────────────────────────────────────────────────────────────

export function* unionFindSteps(mode: UnionFindMode): Generator<UnionFindStep> {
  const nodes = freshNodes()
  const log: LogLine[] = []
  let totalHops = 0

  const say = (kind: LogKind, text: string) => {
    log.push({ kind, text })
    if (log.length > 9) log.shift()
  }

  const emit = (
    partial: Partial<UnionFindStep> & { description: string; phase: UnionFindStep['phase'] },
  ): UnionFindStep => {
    recomputeDepths(nodes)
    return {
      mode,
      nodes: clone(nodes),
      active: [],
      path: [],
      pair: null,
      codeLine: null,
      hops: 0,
      totalHops,
      maxDepth: maxDepthOf(nodes),
      verdict: null,
      log: [...log],
      ...partial,
    }
  }

  /** walk to the root, counting hops and recording the path */
  function findPath(x: number): { root: number; path: number[] } {
    const path: number[] = [x]
    let cur = x
    while (nodes[cur].parent !== cur) {
      cur = nodes[cur].parent
      path.push(cur)
    }
    return { root: cur, path }
  }

  say('note', `${N} elements, each its own set. Same ${UNIONS.length} unions in every mode.`)
  yield emit({
    phase: 'setup',
    codeLine: 0,
    description:
      mode === 'naive'
        ? 'Every element starts pointing at itself. Ten sets, ten representatives, nothing merged yet.'
        : mode === 'ranked'
          ? 'Same start. This time union checks which tree is taller before deciding which one gets attached.'
          : 'Same start. This time find rewrites the path behind it as it returns.',
  })

  // ── unions ────────────────────────────────────────────────────────────────
  for (const [a, b] of UNIONS) {
    const fa = findPath(a)
    const fb = findPath(b)
    const hops = fa.path.length - 1 + (fb.path.length - 1)
    totalHops += hops

    yield emit({
      phase: 'find',
      active: [a, b],
      path: fa.path,
      pair: [a, b],
      codeLine: mode === 'ranked' ? 1 : 1,
      hops,
      totalHops,
      description: `union(${a}, ${b}) — first find both roots. That walk costs ${hops} pointer hop${hops === 1 ? '' : 's'}.`,
    })

    if (fa.root === fb.root) {
      say('note', `${a} and ${b} already connected`)
      continue
    }

    if (mode === 'naive' || mode === 'compressed') {
      // attach b's root under a's root — with this union order that stacks into
      // a chain, which is exactly the pathology this mode is meant to show
      nodes[fb.root].parent = fa.root
      say('union', `union(${a}, ${b}) → ${fb.root} now points at ${fa.root}`)
      yield emit({
        phase: 'union',
        active: [fb.root, fa.root],
        pair: [a, b],
        codeLine: 8,
        totalHops,
        description:
          mode === 'naive'
            ? `Attach ${fb.root} under ${fa.root}. No check on which tree is taller — this is how chains grow.`
            : `Attach ${fb.root} under ${fa.root}. The chain still grows here; compression happens on the next find.`,
      })
    } else {
      const ra = fa.root
      const rb = fb.root
      if (nodes[ra].rank < nodes[rb].rank) {
        nodes[ra].parent = rb
        say('union', `rank ${nodes[ra].rank} < ${nodes[rb].rank} → ${ra} under ${rb}`)
      } else if (nodes[ra].rank > nodes[rb].rank) {
        nodes[rb].parent = ra
        say('union', `rank ${nodes[ra].rank} > ${nodes[rb].rank} → ${rb} under ${ra}`)
      } else {
        nodes[rb].parent = ra
        nodes[ra].rank++
        say('union', `equal rank → ${rb} under ${ra}, rank(${ra}) becomes ${nodes[ra].rank}`)
      }
      yield emit({
        phase: 'union',
        active: [ra, rb],
        pair: [a, b],
        codeLine: 4,
        totalHops,
        description: 'Shorter tree goes under taller. The depth only grows when two equal-rank trees merge.',
      })
    }
  }

  say('note', `unions done. deepest chain: ${maxDepthOf(nodes)}`)
  yield emit({
    phase: 'union',
    codeLine: null,
    totalHops,
    description: `All ${UNIONS.length} unions applied. Deepest chain is now ${maxDepthOf(nodes)} — that number is what every future query has to walk.`,
  })

  // ── queries ───────────────────────────────────────────────────────────────
  for (const q of QUERIES) {
    const { root, path } = findPath(q)
    const hops = path.length - 1
    totalHops += hops

    yield emit({
      phase: 'find',
      active: [q],
      path,
      codeLine: mode === 'compressed' ? 2 : 2,
      hops,
      totalHops,
      description: `find(${q}) walks ${hops} hop${hops === 1 ? '' : 's'} to reach representative ${root}.`,
    })
    say('find', `find(${q}) → ${root} (${hops} hops)`)

    if (mode === 'compressed' && path.length > 2) {
      for (const p of path) nodes[p].parent = root
      say('compress', `path compressed: ${path.slice(0, -1).join(', ')} → ${root}`)
      yield emit({
        phase: 'compress',
        active: path,
        path,
        codeLine: 2,
        totalHops,
        description: `Every node on that path now points straight at ${root}. The next find on any of them costs one hop.`,
      })
    }
  }

  // ── verdict ───────────────────────────────────────────────────────────────
  const finalDepth = maxDepthOf(nodes)
  const verdict: Verdict =
    mode === 'naive'
      ? {
          label: 'Naive',
          steps: `${totalHops} pointer hops`,
          depth: `deepest chain: ${finalDepth}`,
          note: 'Correct, and slow. Nothing stops the tree becoming a linked list, and then every query walks the whole thing again from scratch.',
        }
      : mode === 'ranked'
        ? {
            label: 'Union by rank',
            steps: `${totalHops} pointer hops`,
            depth: `deepest chain: ${finalDepth}`,
            note: 'Attaching the shorter tree under the taller one keeps depth logarithmic. The structure never gets to degenerate in the first place.',
          }
        : {
            label: 'Path compression',
            steps: `${totalHops} pointer hops`,
            depth: `deepest chain: ${finalDepth}`,
            note: 'Each find flattens the path it walked. Asking the question is what makes the next question cheaper — the structure learns from being used.',
          }

  say('note', verdict.steps)
  yield emit({
    phase: 'verdict',
    codeLine: null,
    totalHops,
    verdict,
    description:
      'The set is real. The label on it — the representative — is an accident of the order things got joined.',
  })
}
