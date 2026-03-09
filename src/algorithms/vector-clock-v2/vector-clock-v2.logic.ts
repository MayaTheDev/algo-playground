/**
 * Vector clocks v2 — Day 53.
 *
 * Day 48 built vector clocks to track causality, and they track it correctly.
 * The mistake was thinking that was the same thing as safety.
 *
 * A vector clock is a *reporter*. It can tell you two writes were concurrent.
 * It cannot stop the second one from happening, because nothing ever asked it
 * to. Mutual exclusion is a different job, and it needs a lock.
 *
 * Two runs of the identical partition, differing by two lines of code.
 */

export type VClockV2Mode = 'race' | 'locked'

export type NodeId = 'A' | 'B'

export const NODE_IDS: NodeId[] = ['A', 'B']

export const KEY = 'cart:42'

export type Replica = {
  id: NodeId
  /** one counter per node — [A, B] */
  clock: number[]
  /** the value the replica would serve right now */
  value: string[]
  /** the replica returned OK to a client for a write nobody else has seen */
  believesAuthoritative: boolean
  /** replication the replica could not deliver, held for redelivery */
  outbox: number
}

export type LockState = {
  /** who currently holds the lock on KEY */
  holder: NodeId | null
  /** nodes that cannot reach the lock service right now */
  unreachable: NodeId[]
  /** a write blocked waiting on acquire */
  rejected: NodeId | null
}

export type Message = {
  from: NodeId
  to: NodeId
  clock: number[]
  value: string[]
  state: 'in-flight' | 'dropped' | 'queued' | 'delivered'
}

export type ClockVerdict = 'happened-before' | 'concurrent' | 'equal'

export type Comparison = {
  leftLabel: string
  left: number[]
  rightLabel: string
  right: number[]
  verdict: ClockVerdict
  note: string
}

export type LogKind = 'ok' | 'warn' | 'conflict' | 'blocked' | 'note'

export type LogLine = { text: string; kind: LogKind }

export type VectorClockV2Step = {
  mode: VClockV2Mode
  link: 'up' | 'partitioned'
  nodes: Replica[]
  lock: LockState
  messages: Message[]
  /** index into CODE[mode] currently executing */
  codeLine: number | null
  comparison: Comparison | null
  /** a write that was accepted, acknowledged, and then thrown away */
  lostWrite: string | null
  log: LogLine[]
  phase: 'setup' | 'write' | 'partition' | 'heal' | 'resolve' | 'verdict'
  description: string
}

// ─── The write path, in both versions ────────────────────────────────────────

export const CODE: Record<VClockV2Mode, string[]> = {
  race: [
    'def write(key, value):',
    '    store[key] = value',
    '    clock[me] += 1',
    '    replicate(key, value, clock)',
    '    return OK',
  ],
  locked: [
    'def write(key, value):',
    '    lock.acquire(key)',
    '    try:',
    '        store[key] = value',
    '        clock[me] += 1',
    '        replicate(key, value, clock)',
    '        return OK',
    '    finally:',
    '        lock.release(key)',
  ],
}

export const MODE_LABELS: Record<VClockV2Mode, string> = {
  race: 'no lock — the race',
  locked: 'lock.acquire — the fix',
}

// ─── Clock comparison ────────────────────────────────────────────────────────

export function compareClocks(left: number[], right: number[]): ClockVerdict {
  let leftAhead = false
  let rightAhead = false
  for (let i = 0; i < left.length; i++) {
    if (left[i] > right[i]) leftAhead = true
    if (right[i] > left[i]) rightAhead = true
  }
  if (leftAhead && rightAhead) return 'concurrent'
  if (!leftAhead && !rightAhead) return 'equal'
  return 'happened-before'
}

export function formatClock(clock: number[]): string {
  return `[${clock.join(',')}]`
}

// ─── Step generator ──────────────────────────────────────────────────────────

export function* vectorClockV2Steps(mode: VClockV2Mode): Generator<VectorClockV2Step> {
  const nodes: Replica[] = NODE_IDS.map(id => ({
    id,
    clock: [0, 0],
    value: ['socks'],
    believesAuthoritative: false,
    outbox: 0,
  }))

  let link: VectorClockV2Step['link'] = 'up'
  const lock: LockState = { holder: null, unreachable: [], rejected: null }
  let messages: Message[] = []
  let lostWrite: string | null = null
  const log: LogLine[] = []

  const idx = (id: NodeId) => NODE_IDS.indexOf(id)
  const node = (id: NodeId) => nodes[idx(id)]

  function snapshot(
    phase: VectorClockV2Step['phase'],
    codeLine: number | null,
    description: string,
    comparison: Comparison | null = null,
  ): VectorClockV2Step {
    return {
      mode,
      link,
      nodes: nodes.map(n => ({ ...n, clock: [...n.clock], value: [...n.value] })),
      lock: { ...lock, unreachable: [...lock.unreachable] },
      messages: messages.map(m => ({ ...m, clock: [...m.clock], value: [...m.value] })),
      codeLine,
      comparison,
      lostWrite,
      log: [...log],
      phase,
      description,
    }
  }

  function say(text: string, kind: LogKind = 'note') {
    log.push({ text, kind })
  }

  const locked = mode === 'locked'
  // Line numbers differ between the two versions of write().
  const LINE = locked
    ? { acquire: 1, store: 3, tick: 4, replicate: 5, ok: 6, release: 8 }
    : { acquire: null, store: 1, tick: 2, replicate: 3, ok: 4, release: null }

  // ── Setup ──────────────────────────────────────────────────────────────────

  say(`${KEY} = [socks] on both replicas, clocks [0,0]`, 'ok')
  yield snapshot(
    'setup',
    null,
    `Two replicas of ${KEY}, in sync, clocks [0,0]. The vector clock is [A, B] — one counter per node. ` +
      (locked
        ? 'This run puts every write behind lock.acquire(key).'
        : 'This run is Day 48\'s write path: store, increment, replicate.'),
  )

  // ── Write 1, link healthy ──────────────────────────────────────────────────

  if (locked) {
    lock.holder = 'A'
    say('A: lock.acquire(cart:42) → granted', 'ok')
    yield snapshot('write', LINE.acquire, 'Client 1 writes "boots" to A. First A takes the lock on the key. Nobody else holds it, so acquire returns immediately.')
  }

  node('A').value = ['socks', 'boots']
  yield snapshot(
    'write',
    LINE.store,
    (locked ? '' : 'Client 1 writes "boots" to A. ') +
      'A stores the new cart. The value has changed locally; nothing else knows yet.',
  )

  node('A').clock[idx('A')] += 1
  yield snapshot('write', LINE.tick, `A increments its own counter → A: ${formatClock(node('A').clock)}. This is the clock doing its job: recording that A moved.`)

  messages = [{ from: 'A', to: 'B', clock: [...node('A').clock], value: [...node('A').value], state: 'in-flight' }]
  yield snapshot('write', LINE.replicate, 'A replicates to B, carrying its whole vector clock along with the value.')

  node('B').clock = [...node('A').clock]
  node('B').value = [...node('A').value]
  messages = [{ from: 'A', to: 'B', clock: [...node('A').clock], value: [...node('A').value], state: 'delivered' }]
  say(`B applied A's write, clocks converge on ${formatClock(node('B').clock)}`, 'ok')
  yield snapshot('write', null, `B merges: max([0,0], ${formatClock(node('A').clock)}) then applies the value. Both replicas agree. This is the happy path everyone tests.`)

  if (locked) {
    lock.holder = null
    say('A: lock.release(cart:42) in finally', 'ok')
    yield snapshot('write', LINE.release, 'A releases the lock in a finally block — so a crash mid-write cannot leave the key permanently unwritable.')
  }

  // ── Partition ──────────────────────────────────────────────────────────────

  link = 'partitioned'
  messages = []
  if (locked) {
    // The lock service lives with the majority. B cannot reach it.
    lock.unreachable = ['B']
  }
  say('network partition — A and B cannot reach each other', 'warn')
  yield snapshot(
    'partition',
    null,
    locked
      ? 'The link drops. Both replicas keep serving traffic. B is on the minority side, so it also loses the lock service.'
      : 'The link drops. Both replicas keep serving traffic — neither one is aware anything is wrong.',
  )

  // ── Write 2 on A, during the partition ────────────────────────────────────

  if (locked) {
    lock.holder = 'A'
    say('A: lock.acquire(cart:42) → granted (majority side)', 'ok')
    yield snapshot('write', LINE.acquire, 'Client 1 writes "helmet" to A. A is on the majority side, so acquire still succeeds.')
  }

  node('A').value = [...node('A').value, 'helmet']
  yield snapshot(
    'write',
    LINE.store,
    (locked ? '' : 'Client 1 writes "helmet" to A while the link is down. ') +
      'A stores "helmet". Nothing in this path checks whether anyone else is writing the same key.',
  )

  node('A').clock[idx('A')] += 1
  yield snapshot('write', LINE.tick, `A increments → A: ${formatClock(node('A').clock)}. Perfectly correct bookkeeping. It is also completely local.`)

  node('A').outbox = 1
  messages = [{ from: 'A', to: 'B', clock: [...node('A').clock], value: [...node('A').value], state: locked ? 'queued' : 'dropped' }]
  node('A').believesAuthoritative = true
  say(
    locked
      ? 'A: replication to B queued — partition, will retry'
      : 'A: replication to B dropped — no ack, no retry, returned OK anyway',
    'warn',
  )
  yield snapshot(
    'write',
    LINE.replicate,
    'Replication to B cannot get through. A returns OK to its client regardless — the write path never waited for an acknowledgement.',
  )

  if (locked) {
    lock.holder = null
    yield snapshot('write', LINE.release, 'A releases the lock. The write is durable on A and queued for B.')
  }

  // ── Write 3 on B, during the same partition ───────────────────────────────

  if (locked) {
    lock.rejected = 'B'
    say('B: lock.acquire(cart:42) → FAILED, lock service unreachable', 'blocked')
    yield snapshot(
      'write',
      LINE.acquire,
      'Client 2 writes "lamp" to B. acquire() goes first — and B cannot reach the lock service from the minority side of the partition.',
    )

    say('B: write rejected, client gets an error it can retry', 'blocked')
    yield snapshot(
      'write',
      LINE.acquire,
      'The write never happens. B does not store, does not increment its clock, does not claim authority. The client gets a loud, retryable failure instead of a quiet, permanent one.',
    )
  } else {
    node('B').value = [...node('B').value, 'lamp']
    yield snapshot('write', LINE.store, 'Client 2 writes "lamp" to B. B has no idea A is also taking writes, and nothing in this code path would tell it.')

    node('B').clock[idx('B')] += 1
    yield snapshot('write', LINE.tick, `B increments its own counter → B: ${formatClock(node('B').clock)}. The clock is right again: B did move.`)

    node('B').outbox = 1
    messages = [
      { from: 'A', to: 'B', clock: [2, 0], value: ['socks', 'boots', 'helmet'], state: 'dropped' },
      { from: 'B', to: 'A', clock: [...node('B').clock], value: [...node('B').value], state: 'dropped' },
    ]
    node('B').believesAuthoritative = true
    say('B: replication to A dropped — returned OK anyway', 'warn')
    yield snapshot('write', LINE.replicate, 'B replicates to A. That also fails. B returns OK too.')

    yield snapshot(
      'write',
      LINE.ok,
      `Both replicas have now told a client their write succeeded. A believes ${formatClock(node('A').clock)} is authoritative; ` +
        `B believes ${formatClock(node('B').clock)} is. Neither ever received the other's acknowledgement, so neither has any reason to doubt itself.`,
    )
  }

  // ── Heal ───────────────────────────────────────────────────────────────────

  link = 'up'
  messages = messages.map(m => ({ ...m, state: 'in-flight' }))
  say('partition healed — queued replication drains', 'note')
  yield snapshot('heal', null, 'The partition heals. The replication that was stuck now gets through, in both directions.')

  if (locked) {
    const verdict = compareClocks(node('B').clock, node('A').clock)
    node('B').clock = [...node('A').clock]
    node('B').value = [...node('A').value]
    node('A').outbox = 0
    lock.unreachable = []
    lock.rejected = null
    messages = [{ from: 'A', to: 'B', clock: [...node('A').clock], value: [...node('A').value], state: 'delivered' }]
    say('B applied A\'s queued write — no conflict to resolve', 'ok')

    yield snapshot(
      'resolve',
      null,
      `B compares its clock ${formatClock([1, 0])} against A's ${formatClock(node('A').clock)}. Every component of B's is ≤ A's, so A strictly happened-after. There is nothing to merge — B just applies it.`,
      {
        leftLabel: 'B before heal',
        left: [1, 0],
        rightLabel: 'A',
        right: [...node('A').clock],
        verdict,
        note: 'B\'s history is a prefix of A\'s. One authoritative write, cleanly ordered.',
      },
    )

    yield snapshot(
      'verdict',
      null,
      'Same clock, same partition, same replication. Two extra lines — acquire and release — and there is no divergence to resolve, because there was never a second writer. ' +
        'The vector clock was never the problem. It was doing exactly what it was built to do: report. Nobody had given anything the job of refusing.',
    )
    return
  }

  // ── Conflict detection (race mode) ────────────────────────────────────────

  const clockA = [...node('A').clock]
  const clockB = [...node('B').clock]
  const verdict = compareClocks(clockA, clockB)

  messages = [
    { from: 'A', to: 'B', clock: clockA, value: ['socks', 'boots', 'helmet'], state: 'delivered' },
    { from: 'B', to: 'A', clock: clockB, value: ['socks', 'boots', 'lamp'], state: 'delivered' },
  ]
  say(`conflict detected: ${formatClock(clockA)} ∥ ${formatClock(clockB)}`, 'conflict')

  yield snapshot(
    'resolve',
    null,
    `B receives A's ${formatClock(clockA)} and A receives B's ${formatClock(clockB)}. Element-wise: A is ahead on slot A, B is ahead on slot B. ` +
      'Neither dominates. The clock is telling the truth — these two writes are concurrent.',
    {
      leftLabel: 'A',
      left: clockA,
      rightLabel: 'B',
      right: clockB,
      verdict,
      note: 'Concurrent. The clock detected the conflict perfectly — after both writes had already been acknowledged to two different clients.',
    },
  )

  // ── Resolution: someone loses ─────────────────────────────────────────────

  lostWrite = 'lamp'
  node('B').clock = [Math.max(clockA[0], clockB[0]), Math.max(clockA[1], clockB[1])]
  node('A').clock = [...node('B').clock]
  node('A').value = ['socks', 'boots', 'helmet']
  node('B').value = ['socks', 'boots', 'helmet']
  node('A').believesAuthoritative = false
  node('B').believesAuthoritative = false
  node('A').outbox = 0
  node('B').outbox = 0
  say('last-writer-wins: "helmet" kept, "lamp" discarded', 'conflict')

  yield snapshot(
    'resolve',
    null,
    'Something has to pick. Last-writer-wins compares wall clocks and keeps "helmet". "lamp" is discarded — a write that was accepted, acknowledged, and then thrown away. ' +
      'The customer who added it will not be told.',
    {
      leftLabel: 'A',
      left: clockA,
      rightLabel: 'B',
      right: clockB,
      verdict,
      note: 'Detection is not prevention. The clock found the conflict; it could not have prevented it.',
    },
  )

  yield snapshot(
    'verdict',
    null,
    'The clock was correct at every step. It incremented correctly, it merged correctly, it identified the concurrency correctly. ' +
      'The bug was that two writers were allowed into the same key at the same time — and no vector clock has ever prevented that. Switch to the locked run.',
  )
}
