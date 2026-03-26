/**
 * Race conditions, mutexes and deadlock — Day 62.
 *
 * A race condition is two processes modifying shared state at the same time
 * without coordination. Neither one is wrong. They are both doing exactly what
 * they were told to do. But they are doing it simultaneously, and the result is
 * undefined — which is the technical term for: it could be anything, and all of
 * the anythings are bad.
 *
 * Three runs of the same two threads:
 *   race     — interleaved read-modify-write, and the lost update
 *   mutex    — one lock, correct, and you can see the waiting
 *   deadlock — two locks taken in opposite orders, and nobody moves again
 */

export type MutexMode = 'race' | 'mutex' | 'deadlock'

export type ThreadId = 'T1' | 'T2'

export const THREADS: ThreadId[] = ['T1', 'T2']

export type ThreadState = 'ready' | 'running' | 'waiting' | 'done' | 'blocked'

export type Thread = {
  id: ThreadId
  state: ThreadState
  /** the value this thread is holding in its register */
  register: number | null
  /** which program line it is on */
  pc: number
  /** locks this thread currently holds */
  holds: string[]
  /** lock it is blocked waiting for */
  waitingFor: string | null
}

export type LogKind = 'read' | 'write' | 'lock' | 'unlock' | 'block' | 'lost' | 'note'

export type LogLine = {
  kind: LogKind
  text: string
}

export type Verdict = {
  label: string
  result: string
  expected: string
  note: string
}

export type MutexStep = {
  mode: MutexMode
  /** the shared value in memory */
  balance: number
  /** how much each thread intends to add */
  deposits: Record<ThreadId, number>
  threads: Thread[]
  /** lock name -> holder */
  locks: Record<string, ThreadId | null>
  /** thread acting this step */
  active: ThreadId | null
  /** index into CODE[mode] */
  codeLine: number | null
  /** a write silently discarded another thread's write */
  lostUpdate: boolean
  /** everyone is blocked forever */
  deadlocked: boolean
  verdict: Verdict | null
  log: LogLine[]
  phase: 'setup' | 'run' | 'lost' | 'deadlock' | 'verdict'
  description: string
}

export const MODE_LABELS: Record<MutexMode, string> = {
  race: 'Race condition',
  mutex: 'Mutex',
  deadlock: 'Deadlock',
}

export const CODE: Record<MutexMode, string[]> = {
  race: [
    'function deposit(amount) {',
    '  const current = balance   // read',
    '  balance = current + amount // write',
    '}',
    '',
    '// two threads. no coordination.',
    '// both read before either writes.',
  ],
  mutex: [
    'async function deposit(amount) {',
    '  await lock.acquire()      // wait your turn',
    '  try {',
    '    const current = balance',
    '    balance = current + amount',
    '  } finally {',
    '    lock.release()          // always release',
    '  }',
    '}',
  ],
  deadlock: [
    '// T1                    // T2',
    'await lockA.acquire()   await lockB.acquire()',
    'await lockB.acquire()   await lockA.acquire()',
    '//      ^ waits for T2        ^ waits for T1',
    '',
    '// each holds what the other needs.',
    '// neither will ever release.',
  ],
}

const START_BALANCE = 100
const DEPOSITS: Record<ThreadId, number> = { T1: 50, T2: 30 }

// ─── generator ───────────────────────────────────────────────────────────────

export function* mutexSteps(mode: MutexMode): Generator<MutexStep> {
  let balance = START_BALANCE
  const log: LogLine[] = []
  const locks: Record<string, ThreadId | null> =
    mode === 'deadlock' ? { lockA: null, lockB: null } : { lock: null }

  const threads: Thread[] = THREADS.map(id => ({
    id,
    state: 'ready',
    register: null,
    pc: 0,
    holds: [],
    waitingFor: null,
  }))

  const T = (id: ThreadId) => threads.find(t => t.id === id)!

  const say = (kind: LogKind, text: string) => {
    log.push({ kind, text })
    if (log.length > 9) log.shift()
  }

  const emit = (
    partial: Partial<MutexStep> & { description: string; phase: MutexStep['phase'] },
  ): MutexStep => ({
    mode,
    balance,
    deposits: DEPOSITS,
    threads: threads.map(t => ({ ...t, holds: [...t.holds] })),
    locks: { ...locks },
    active: null,
    codeLine: null,
    lostUpdate: false,
    deadlocked: false,
    verdict: null,
    log: [...log],
    ...partial,
  })

  const expected = START_BALANCE + DEPOSITS.T1 + DEPOSITS.T2

  say('note', `balance starts at ${START_BALANCE}. T1 deposits ${DEPOSITS.T1}, T2 deposits ${DEPOSITS.T2}.`)
  yield emit({
    phase: 'setup',
    codeLine: 0,
    description:
      mode === 'race'
        ? `Two threads, one shared balance. Correct result should be ${expected}.`
        : mode === 'mutex'
          ? 'Same two threads, same deposits — but now there is a lock in the write path.'
          : 'Two locks this time, and the two threads acquire them in opposite orders.',
  })

  // ── deadlock ──────────────────────────────────────────────────────────────
  if (mode === 'deadlock') {
    locks.lockA = 'T1'
    T('T1').holds = ['lockA']
    T('T1').state = 'running'
    T('T1').pc = 1
    say('lock', 'T1 acquires lockA')
    yield emit({ phase: 'run', active: 'T1', codeLine: 1, description: 'T1 takes lockA and starts its work.' })

    locks.lockB = 'T2'
    T('T2').holds = ['lockB']
    T('T2').state = 'running'
    T('T2').pc = 1
    say('lock', 'T2 acquires lockB')
    yield emit({ phase: 'run', active: 'T2', codeLine: 1, description: 'T2 takes lockB. So far nothing is wrong — each holds a different lock.' })

    T('T1').state = 'blocked'
    T('T1').waitingFor = 'lockB'
    T('T1').pc = 2
    say('block', 'T1 wants lockB — held by T2')
    yield emit({ phase: 'run', active: 'T1', codeLine: 2, description: 'T1 now needs lockB to continue. T2 is holding it, so T1 blocks.' })

    T('T2').state = 'blocked'
    T('T2').waitingFor = 'lockA'
    T('T2').pc = 2
    say('block', 'T2 wants lockA — held by T1')
    yield emit({
      phase: 'deadlock',
      active: 'T2',
      codeLine: 2,
      deadlocked: true,
      description: 'T2 needs lockA, which T1 is holding and will not release until it gets lockB. Both threads are now waiting on each other.',
    })

    yield emit({
      phase: 'verdict',
      codeLine: 3,
      deadlocked: true,
      verdict: {
        label: 'Deadlock',
        result: 'both threads blocked forever',
        expected: `${expected}`,
        note: 'Neither thread is buggy on its own — each takes the locks it needs. The bug is in the ORDER. Fix it by giving every lock a global rank and always acquiring in that order, so a cycle can never form.',
      },
      description:
        'A mutex prevents a race and introduces a new failure mode. Nothing here is corrupt; nothing here will ever finish either.',
    })
    return
  }

  // ── race / mutex ──────────────────────────────────────────────────────────
  if (mode === 'race') {
    // interleaved: both read before either writes
    T('T1').state = 'running'
    T('T1').register = balance
    T('T1').pc = 1
    say('read', `T1 reads balance = ${balance}`)
    yield emit({ phase: 'run', active: 'T1', codeLine: 1, description: `T1 reads the balance into its own register: ${balance}.` })

    T('T2').state = 'running'
    T('T2').register = balance
    T('T2').pc = 1
    say('read', `T2 reads balance = ${balance}`)
    yield emit({
      phase: 'run',
      active: 'T2',
      codeLine: 1,
      description: `T2 reads the balance before T1 has written anything back. Both registers now hold ${balance}. This is the moment the result becomes undefined.`,
    })

    balance = (T('T1').register as number) + DEPOSITS.T1
    T('T1').pc = 2
    T('T1').state = 'done'
    say('write', `T1 writes ${balance}`)
    yield emit({ phase: 'run', active: 'T1', codeLine: 2, description: `T1 writes ${T('T1').register} + ${DEPOSITS.T1} = ${balance}. Correct, as far as T1 knows.` })

    balance = (T('T2').register as number) + DEPOSITS.T2
    T('T2').pc = 2
    T('T2').state = 'done'
    say('lost', `T2 writes ${balance} — T1's deposit is gone`)
    yield emit({
      phase: 'lost',
      active: 'T2',
      codeLine: 2,
      lostUpdate: true,
      description: `T2 writes ${T('T2').register} + ${DEPOSITS.T2} = ${balance}, overwriting T1's result. T1's deposit was accepted, acknowledged, and silently discarded.`,
    })

    yield emit({
      phase: 'verdict',
      codeLine: null,
      lostUpdate: true,
      verdict: {
        label: 'Race condition',
        result: `${balance}`,
        expected: `${expected}`,
        note: `Neither thread did anything wrong. Both read, both added, both wrote. The ${DEPOSITS.T1} that vanished was never rejected — it was recorded and then overwritten, which is worse, because nothing reports an error.`,
      },
      description:
        'Read-modify-write is three operations pretending to be one. Anything can happen in the gaps.',
    })
    return
  }

  // mutex
  locks.lock = 'T1'
  T('T1').state = 'running'
  T('T1').holds = ['lock']
  T('T1').pc = 1
  say('lock', 'T1 acquires the lock')
  yield emit({ phase: 'run', active: 'T1', codeLine: 1, description: 'T1 takes the lock before touching the balance.' })

  T('T2').state = 'waiting'
  T('T2').waitingFor = 'lock'
  T('T2').pc = 1
  say('block', 'T2 waits — lock held by T1')
  yield emit({
    phase: 'run',
    active: 'T2',
    codeLine: 1,
    description: 'T2 arrives and finds the lock taken. It waits. This is the cost of correctness — visible, bounded, and much cheaper than a lost write.',
  })

  T('T1').register = balance
  T('T1').pc = 3
  say('read', `T1 reads balance = ${balance}`)
  yield emit({ phase: 'run', active: 'T1', codeLine: 3, description: `T1 reads ${balance}. Nobody else can read it right now.` })

  balance = (T('T1').register as number) + DEPOSITS.T1
  T('T1').pc = 4
  say('write', `T1 writes ${balance}`)
  yield emit({ phase: 'run', active: 'T1', codeLine: 4, description: `T1 writes ${balance}. The read and the write happened as one indivisible unit.` })

  locks.lock = null
  T('T1').holds = []
  T('T1').state = 'done'
  T('T1').pc = 6
  say('unlock', 'T1 releases the lock')
  yield emit({ phase: 'run', active: 'T1', codeLine: 6, description: 'T1 releases the lock in a finally block — so it releases even if the work throws.' })

  locks.lock = 'T2'
  T('T2').state = 'running'
  T('T2').holds = ['lock']
  T('T2').waitingFor = null
  T('T2').register = balance
  T('T2').pc = 3
  say('lock', `T2 acquires the lock, reads ${balance}`)
  yield emit({ phase: 'run', active: 'T2', codeLine: 3, description: `T2 wakes, takes the lock, and reads ${balance} — T1's write, not the stale value.` })

  balance = (T('T2').register as number) + DEPOSITS.T2
  locks.lock = null
  T('T2').holds = []
  T('T2').state = 'done'
  T('T2').pc = 6
  say('write', `T2 writes ${balance}`)
  yield emit({ phase: 'run', active: 'T2', codeLine: 4, description: `T2 writes ${balance}. Both deposits survived.` })

  yield emit({
    phase: 'verdict',
    codeLine: null,
    verdict: {
      label: 'Mutex',
      result: `${balance}`,
      expected: `${expected}`,
      note: 'Mutual exclusion. One thread holds the lock, does the work, releases it; the other waits. The race is gone — and the waiting is the price, which is why you hold locks for as short a time as possible.',
    },
    description:
      'Coordination eliminates the race. It does not eliminate contention — it makes contention visible and survivable.',
  })
}
