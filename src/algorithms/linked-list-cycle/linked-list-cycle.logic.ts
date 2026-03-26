/**
 * Linked lists & Floyd's cycle detection — Day 67.
 *
 * A node holds a value and a pointer to the next node. That is the entire data
 * structure, which is why it looks unglamorous and why nobody builds a portfolio
 * project out of it.
 *
 * Then you get to cycle detection.
 *
 * You are walking a list and you need to know whether it ends or loops. The
 * obvious answer is to remember every node you have visited. That works, and it
 * costs memory proportional to the length of the list — which on a long enough
 * list is the whole problem.
 *
 * Floyd's answer is two pointers at different speeds. Constant memory. You don't
 * remember anything. You just need something moving faster than you are.
 *
 *   hashset   — remember everything, O(n) space
 *   floyd     — two pointers, O(1) space
 *   acyclic   — the same two pointers on a list that actually ends
 */

export type CycleMode = 'hashset' | 'floyd' | 'acyclic'

export type ListNode = {
  id: number
  value: string
  next: number | null
}

export type LogKind = 'visit' | 'store' | 'meet' | 'exit' | 'note'

export type LogLine = {
  kind: LogKind
  text: string
}

export type Verdict = {
  label: string
  time: string
  space: string
  note: string
}

export type CycleStep = {
  mode: CycleMode
  nodes: ListNode[]
  /** slow pointer position (or the single walker in hashset mode) */
  slow: number | null
  /** fast pointer position — floyd modes only */
  fast: number | null
  /** node ids currently held in the visited set — hashset mode only */
  seen: number[]
  /** they landed on the same node */
  met: boolean
  /** the walk fell off the end */
  fellOff: boolean
  /** index into CODE[mode] currently executing */
  codeLine: number | null
  /** how many node references are being held in memory right now */
  memory: number
  /** steps taken so far */
  ticks: number
  verdict: Verdict | null
  log: LogLine[]
  phase: 'setup' | 'walk' | 'meet' | 'exit' | 'verdict'
  description: string
}

export const MODE_LABELS: Record<CycleMode, string> = {
  hashset: 'Hash set',
  floyd: "Floyd's",
  acyclic: 'No cycle',
}

export const CODE: Record<CycleMode, string[]> = {
  hashset: [
    'function hasCycle(head) {',
    '  const seen = new Set()',
    '  let node = head',
    '  while (node) {',
    '    if (seen.has(node)) return true',
    '    seen.add(node)          // grows with n',
    '    node = node.next',
    '  }',
    '  return false',
    '}  // O(n) time. O(n) space.',
  ],
  floyd: [
    'function hasCycle(head) {',
    '  let slow = head, fast = head',
    '  while (fast?.next) {',
    '    slow = slow.next        // one step',
    '    fast = fast.next.next   // two steps',
    '    if (slow === fast) return true',
    '  }',
    '  return false',
    '}  // O(n) time. O(1) space.',
  ],
  acyclic: [
    'function hasCycle(head) {',
    '  let slow = head, fast = head',
    '  while (fast?.next) {',
    '    slow = slow.next',
    '    fast = fast.next.next',
    '    if (slow === fast) return true',
    '  }',
    '  return false            // fast fell off',
    '}',
  ],
}

// ─── list construction ───────────────────────────────────────────────────────

const VALUES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

/** 9 nodes; tail links back to index 3 unless acyclic */
function buildList(cyclic: boolean): ListNode[] {
  return VALUES.map((v, i) => ({
    id: i,
    value: v,
    next: i < VALUES.length - 1 ? i + 1 : cyclic ? 3 : null,
  }))
}

// ─── generator ───────────────────────────────────────────────────────────────

export function* cycleSteps(mode: CycleMode): Generator<CycleStep> {
  const cyclic = mode !== 'acyclic'
  const nodes = buildList(cyclic)
  const log: LogLine[] = []
  const seen: number[] = []
  let ticks = 0

  const say = (kind: LogKind, text: string) => {
    log.push({ kind, text })
    if (log.length > 9) log.shift()
  }

  const emit = (
    partial: Partial<CycleStep> & { description: string; phase: CycleStep['phase'] },
  ): CycleStep => ({
    mode,
    nodes,
    slow: null,
    fast: null,
    seen: [...seen],
    met: false,
    fellOff: false,
    codeLine: null,
    memory: mode === 'hashset' ? seen.length : 2,
    ticks,
    verdict: null,
    log: [...log],
    ...partial,
  })

  say('note', cyclic ? `${VALUES.length} nodes. The tail links back to D.` : `${VALUES.length} nodes. The tail is null.`)

  yield emit({
    phase: 'setup',
    slow: 0,
    fast: mode === 'hashset' ? null : 0,
    codeLine: mode === 'hashset' ? 2 : 1,
    description:
      mode === 'hashset'
        ? 'One walker, and a set to remember everywhere it has been. The set is the part that costs.'
        : "Two pointers, both at the head. One will move one node at a time, the other two.",
  })

  // ── hash set walk ─────────────────────────────────────────────────────────
  if (mode === 'hashset') {
    let node: number | null = 0
    while (node !== null) {
      ticks++
      if (seen.includes(node)) {
        say('meet', `${nodes[node].value} already in the set — cycle found`)
        yield emit({
          phase: 'meet',
          slow: node,
          met: true,
          codeLine: 4,
          description: `${nodes[node].value} is already in the set. That proves a cycle — but it took ${seen.length} stored references to find out.`,
        })
        break
      }
      seen.push(node)
      say('store', `store ${nodes[node].value} — set holds ${seen.length}`)
      yield emit({
        phase: 'walk',
        slow: node,
        codeLine: 5,
        description: `Visit ${nodes[node].value}, add it to the set. Memory in use is now ${seen.length} references and still climbing.`,
      })
      node = nodes[node].next
    }
  } else {
    // ── Floyd's walk ────────────────────────────────────────────────────────
    let slow = 0
    let fast = 0
    while (true) {
      const f1 = nodes[fast].next
      const f2 = f1 === null ? null : nodes[f1].next
      if (f1 === null || f2 === null) {
        ticks++
        say('exit', 'fast pointer reached the end — no cycle')
        yield emit({
          phase: 'exit',
          slow,
          fast: f1 ?? fast,
          fellOff: true,
          codeLine: 7,
          description:
            'The fast pointer ran off the end of the list. If there were a loop it could never have escaped — so the list terminates.',
        })
        break
      }

      slow = nodes[slow].next as number
      fast = f2
      ticks++

      if (slow === fast) {
        say('meet', `both pointers on ${nodes[slow].value} — cycle found`)
        yield emit({
          phase: 'meet',
          slow,
          fast,
          met: true,
          codeLine: 5,
          description: `Both pointers are on ${nodes[slow].value}. The gap closes by exactly one node per step, so the fast one cannot skip past — the meeting is guaranteed.`,
        })
        break
      }

      say('visit', `slow → ${nodes[slow].value}, fast → ${nodes[fast].value}`)
      yield emit({
        phase: 'walk',
        slow,
        fast,
        codeLine: 4,
        description: `Slow is on ${nodes[slow].value}, fast is on ${nodes[fast].value}. Two references held, no matter how long the list gets.`,
      })
    }
  }

  // ── verdict ───────────────────────────────────────────────────────────────
  const verdict: Verdict =
    mode === 'hashset'
      ? {
          label: 'Hash set',
          time: `${ticks} steps`,
          space: `${seen.length} references held`,
          note: 'Correct, and the memory grows with the list. On a list long enough to matter, the set is the problem you were trying to avoid.',
        }
      : mode === 'floyd'
        ? {
            label: "Floyd's",
            time: `${ticks} steps`,
            space: '2 references held',
            note: 'Constant memory. You do not remember anything — you just need a second pointer moving at a different speed, and the meeting does the proving for you.',
          }
        : {
            label: 'No cycle',
            time: `${ticks} steps`,
            space: '2 references held',
            note: 'Same two pointers, same constant memory. When the list ends, the fast one simply falls off — and falling off is itself the answer.',
          }

  say('note', verdict.space)
  yield emit({
    phase: 'verdict',
    slow: null,
    fast: null,
    codeLine: null,
    verdict,
    description:
      'You cannot tell you are going in circles from inside your own pace. Every step feels like a step.',
  })
}
